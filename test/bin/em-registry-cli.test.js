'use strict'

/* eslint-env mocha */
/* eslint-disable no-unused-expressions, import/no-extraneous-dependencies */

require('../test-setup')

const { expect } = require('chai')
const sinon = require('sinon')

describe('bin/em-registry-cli', () => {
  const box = sinon.createSandbox()
  const cli = require('../../bin/em-registry-cli.js')

  beforeEach(() => {
    // box = sinon.createSandbox()
  })

  afterEach(() => {
    box.restore()
  })

  describe('#uploadArtifact', () => {
    context('when plaform is mac', () => {
      const os = require('os')

      beforeEach(() => {
        box.stub(os, 'platform').callsFake(() => 'mac')
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
