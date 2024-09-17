/* eslint-env mocha */
/* eslint-disable no-unused-expressions, import/no-extraneous-dependencies */

import '../test-setup.js'
import os from 'node:os'

import { expect } from 'chai'
import sinon from 'sinon'
import cli from '../../bin/em-registry-cli.mjs'

describe('bin/em-registry-cli', () => {
  const box = sinon.createSandbox()
  // beforeEach(() => {  })

  afterEach(() => {
    box.restore()
  })

  describe('#uploadArtifact', () => {
    describe('when plaform is mac', () => {


      beforeEach(() => {
        box.stub(os, 'platform').callsFake(() => 'darwin')
      })

      it('should set env.NODE_TLS_REJECT_UNAUTHORIZED to "0"', async () => {
        const fakeForm = {
          append () {},
          submit (url, cb) {
            cb(null, {
              on (event, eventCb) {
                if (event === 'end') eventCb()
              }
            })
          }
        }
        const uploadURL = { url: '', fields: [] }
        const compressedFileName = 'A'
        const compressedFileBuffer = Buffer.from('A')

        const res = await cli.uploadArtifact(os, fakeForm, uploadURL, compressedFileName, compressedFileBuffer)

        expect(process.env).to.have.property('NODE_TLS_REJECT_UNAUTHORIZED', '0')
      })
    })
  })
})
