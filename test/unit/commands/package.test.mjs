import { strict as assert } from 'assert'
import { describe, it, beforeEach, afterEach } from 'mocha'
import sinon from 'sinon'
import path from 'path'
import fs from 'node:fs/promises'
import yazl from 'yazl'

import { addDirectory } from '../../../src/commands/package.mjs'

describe('package.mjs', () => {
  describe('addDirectory', () => {
    let sandbox
    let zipfileMock
    let fsOpenDirStub
    let fsLstatStub
    let consoleLogStub
    
    beforeEach(() => {
      sandbox = sinon.createSandbox()
      
      // Mock zipfile
      zipfileMock = {
        addFile: sandbox.stub()
      }
      
      // Mock console.log to avoid test output noise
      consoleLogStub = sandbox.stub(console, 'log')
    })
    
    afterEach(() => {
      sandbox.restore()
    })
    
    it('should add files from a directory to the zipfile', async () => {
      // Setup mock directory with files
      const mockDir = {
        entries: () => [
          { name: 'file1.js', isFile: () => true, isDirectory: () => false },
          { name: 'file2.js', isFile: () => true, isDirectory: () => false }
        ]
      }
      
      fsOpenDirStub = sandbox.stub(fs, 'opendir').resolves(mockDir)
      
      // Mock file stats
      fsLstatStub = sandbox.stub(fs, 'lstat')
      fsLstatStub.withArgs(path.join('testDir', 'file1.js')).resolves({ isFile: () => true, isDirectory: () => false })
      fsLstatStub.withArgs(path.join('testDir', 'file2.js')).resolves({ isFile: () => true, isDirectory: () => false })
      
      // Execute
      await addDirectory('testDir', zipfileMock)
      
      // Verify
      assert.equal(zipfileMock.addFile.callCount, 2)
      
      // In the actual function, entryName is calculated as filePath.slice(filePath.indexOf(path.sep) + 1)
      // For 'testDir/file1.js', this would be 'file1.js' if the first part of the path contains path.sep
      assert(zipfileMock.addFile.calledWith(path.join('testDir', 'file1.js'), 'file1.js'))
      assert(zipfileMock.addFile.calledWith(path.join('testDir', 'file2.js'), 'file2.js'))
    })
    
    it('should recursively add files from subdirectories', async () => {
      // Setup mock directory with files and subdirectory
      const mockEntries = [
        { name: 'file1.js', isFile: () => true, isDirectory: () => false },
        { name: 'subdir', isFile: () => false, isDirectory: () => true }
      ]
      
      const mockDir = {
        entries: () => mockEntries
      }
      
      const mockSubDir = {
        entries: () => [
          { name: 'subfile.js', isFile: () => true, isDirectory: () => false }
        ]
      }
      
      fsOpenDirStub = sandbox.stub(fs, 'opendir')
      fsOpenDirStub.withArgs('testDir').resolves(mockDir)
      fsOpenDirStub.withArgs(path.join('testDir', 'subdir')).resolves(mockSubDir)
      
      // Mock file stats
      fsLstatStub = sandbox.stub(fs, 'lstat')
      fsLstatStub.withArgs(path.join('testDir', 'file1.js')).resolves({ isFile: () => true, isDirectory: () => false })
      fsLstatStub.withArgs(path.join('testDir', 'subdir')).resolves({ isFile: () => false, isDirectory: () => true })
      fsLstatStub.withArgs(path.join('testDir', 'subdir', 'subfile.js')).resolves({ isFile: () => true, isDirectory: () => false })
      
      // Execute
      await addDirectory('testDir', zipfileMock)
      
      // Verify
      assert.equal(zipfileMock.addFile.callCount, 2) // One file in root dir + one file in subdir
      
      // In the actual function, entryName is calculated as filePath.slice(filePath.indexOf(path.sep) + 1)
      assert(zipfileMock.addFile.calledWith(path.join('testDir', 'file1.js'), 'file1.js'))
      assert(zipfileMock.addFile.calledWith(path.join('testDir', 'subdir', 'subfile.js'), 'subdir' + path.sep + 'subfile.js'))
    })
    
    it('should handle empty directories', async () => {
      // Setup mock empty directory
      const mockDir = {
        entries: () => []
      }
      
      fsOpenDirStub = sandbox.stub(fs, 'opendir').resolves(mockDir)
      
      // Execute
      await addDirectory('emptyDir', zipfileMock)
      
      // Verify
      assert.equal(zipfileMock.addFile.callCount, 0)
    })
    
    it('should handle errors when opening directory', async () => {
      // Setup directory open error
      const error = new Error('Directory not found')
      error.code = 'ENOENT'
      
      fsOpenDirStub = sandbox.stub(fs, 'opendir').rejects(error)
      
      // Execute and verify
      await assert.rejects(
        async () => { await addDirectory('nonExistentDir', zipfileMock) },
        { message: 'Directory not found' }
      )
      
      assert.equal(zipfileMock.addFile.callCount, 0)
    })
  })
})
