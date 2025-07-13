import { strict as assert } from 'assert'
import { describe, it, beforeEach, afterEach } from 'mocha'
import sinon from 'sinon'
import path from 'path'
import fs from 'node:fs/promises'
import os from 'node:os'
import httpClient from '@everymundo/http-client'
import { parseJson } from '@everymundo/json-utils'
import Ajv from 'ajv'

import { validateSetupJson } from '../../../src/commands/validate.mjs'

describe('validate.mjs', () => {
  describe('validateSetupJson', () => {
    let sandbox
    let fsStatStub
    let fsReadFileStub
    let fsWriteFileStub
    let httpClientGetEndpointStub
    let endpointGetStub
    let consoleLogStub
    let consoleErrorStub
    let ajvCompileStub
    let validateStub
    
    const mockSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        version: { type: 'string' }
      },
      required: ['name', 'version']
    }
    
    const mockSetupJson = {
      name: 'test-module',
      version: '1.0.0'
    }
    
    const mockTempFilePath = path.join(os.tmpdir(), 'setup-json-spec-schema-minified-cached.json')
    
    beforeEach(() => {
      sandbox = sinon.createSandbox()
      
      // Mock fs functions
      fsStatStub = sandbox.stub(fs, 'stat')
      fsReadFileStub = sandbox.stub(fs, 'readFile')
      fsWriteFileStub = sandbox.stub(fs, 'writeFile').resolves()
      
      // Mock httpClient
      endpointGetStub = sandbox.stub().resolves({ buffer: JSON.stringify(mockSchema) })
      httpClientGetEndpointStub = sandbox.stub(httpClient, 'GetEndpoint').returns({
        get: endpointGetStub
      })
      
      // Mock console methods
      consoleLogStub = sandbox.stub(console, 'log')
      consoleErrorStub = sandbox.stub(console, 'error')
      
      // Mock Ajv
      validateStub = sandbox.stub().returns(true)
      ajvCompileStub = sandbox.stub(Ajv.prototype, 'compile').returns(validateStub)
    })
    
    afterEach(() => {
      sandbox.restore()
    })
    
    it('should validate setup JSON against schema successfully', async () => {
      // Mock that the cache file doesn't exist (force fetch from remote)
      fsStatStub.rejects(new Error('File not found'))
      
      await validateSetupJson(mockSetupJson)
      
      // Verify schema was fetched and cached
      assert(httpClientGetEndpointStub.calledOnce)
      assert(fsWriteFileStub.calledOnce)
      assert(fsWriteFileStub.calledWith(mockTempFilePath, JSON.stringify(mockSchema)))
      
      // Verify validation was performed
      assert(ajvCompileStub.calledOnce)
      assert(validateStub.calledOnce)
      assert(validateStub.calledWith(mockSetupJson))
      
      // Verify success message was logged
      assert(consoleLogStub.calledWith('Schema validation: ✅ PASS'))
      assert(consoleErrorStub.notCalled)
    })
    
    it('should use cached schema if it exists and is not expired', async () => {
      // Mock that the cache file exists and is recent
      fsStatStub.resolves({
        ctime: new Date(Date.now() - 800000), // Less than 864000ms old
      })
      fsReadFileStub.resolves(JSON.stringify(mockSchema))
      
      await validateSetupJson(mockSetupJson)
      
      // Verify schema was read from cache
      assert(httpClientGetEndpointStub.notCalled)
      assert(fsReadFileStub.calledOnce)
      
      // Verify validation was performed
      assert(ajvCompileStub.calledOnce)
      assert(validateStub.calledOnce)
    })
    
    it('should fetch new schema if cached schema is expired', async () => {
      // Mock that the cache file exists but is old
      fsStatStub.resolves({
        ctime: new Date(Date.now() - 900000), // More than 864000ms old
      })
      
      await validateSetupJson(mockSetupJson)
      
      // Verify schema was fetched and cached
      assert(httpClientGetEndpointStub.calledOnce)
      assert(fsWriteFileStub.calledOnce)
    })
    
    it('should report validation errors when setup JSON is invalid', async () => {
      // Mock that validation fails
      validateStub.returns(false)
      validateStub.errors = [
        { keyword: 'required', message: 'should have required property', params: { missingProperty: 'name' } }
      ]
      
      fsStatStub.rejects(new Error('File not found'))
      
      await validateSetupJson(mockSetupJson)
      
      // Verify error was logged
      assert(consoleErrorStub.calledTwice)
      assert(consoleLogStub.notCalled)
      assert(consoleErrorStub.calledWith('Schema validation: ❌ ERROR'))
    })
    
    it('should throw error if schema fetch fails', async () => {
      // Mock that the cache file doesn't exist and fetch fails
      fsStatStub.rejects(new Error('File not found'))
      const fetchError = new Error('Network error')
      endpointGetStub.rejects(fetchError)
      
      await assert.rejects(
        async () => { await validateSetupJson(mockSetupJson) },
        { message: `Error fetching schema https://everymundo.github.io/registry/playground/setup-schema.json: ${fetchError.message}` }
      )
    })
  })
})
