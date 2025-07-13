import { strict as assert } from 'assert'
import { describe, it } from 'mocha'

import { parseVersion } from '../../../lib/registry-webapis.mjs'

describe('registry-webapis', () => {
  describe('parseVersion', () => {
    it('should return 0 when input is not a string', () => {
      assert.equal(parseVersion(null), 0)
      assert.equal(parseVersion(undefined), 0)
      assert.equal(parseVersion(123), 0)
      assert.equal(parseVersion({}), 0)
      assert.equal(parseVersion([]), 0)
    })

    it('should return 0 when input is an empty string', () => {
      assert.equal(parseVersion(''), 0)
      assert.equal(parseVersion('  '), 0)
    })

    it('should return 0 when input does not contain any dots', () => {
      assert.equal(parseVersion('123'), 0)
      assert.equal(parseVersion('version1'), 0)
    })

    it('should parse major.minor.patch format correctly', () => {
      // 1.2.3 = 1*1000000 + 2*1000 + 3 = 1002003
      assert.equal(parseVersion('1.2.3'), 1002003)
      // 2.0.0 = 2*1000000 + 0*1000 + 0 = 2000000
      assert.equal(parseVersion('2.0.0'), 2000000)
      // 0.1.0 = 0*1000000 + 1*1000 + 0 = 1000
      assert.equal(parseVersion('0.1.0'), 1000)
      // 0.0.5 = 0*1000000 + 0*1000 + 5 = 5
      assert.equal(parseVersion('0.0.5'), 5)
      // 10.20.30 = 10*1000000 + 20*1000 + 30 = 10020030
      assert.equal(parseVersion('10.20.30'), 10020030)
    })

    it('should handle major.minor format (missing patch)', () => {
      // 1.2 = 1*1000000 + 2*1000 + 0 = 1002000
      assert.equal(parseVersion('1.2'), 1002000)
      // 3.0 = 3*1000000 + 0*1000 + 0 = 3000000
      assert.equal(parseVersion('3.0'), 3000000)
    })

    it('should handle non-numeric patch versions', () => {
      // 1.2.abc = 1*1000000 + 2*1000 + 0 = 1002000
      assert.equal(parseVersion('1.2.abc'), 1002000)
      // 2.3.beta = 2*1000000 + 3*1000 + 0 = 2003000
      assert.equal(parseVersion('2.3.beta'), 2003000)
    })

    it('should handle version strings with additional segments', () => {
      // 1.2.3.4 = 1*1000000 + 2*1000 + 3 = 1002003 (ignores the 4)
      assert.equal(parseVersion('1.2.3.4'), 1002003)
      // 2.3.4-beta = 2*1000000 + 3*1000 + 4 = 2003004 (ignores the -beta)
      assert.equal(parseVersion('2.3.4-beta'), 2003004)
    })
  })
})
