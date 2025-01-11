import { isValidString } from '../bot/utils'

describe('isValidString', () => {
  it('Should not allow empty string', () => {
    expect(isValidString('')).toBe(false)
  })

  it('Should not allow sql injection symbols', () => {
    expect(isValidString("'")).toBe(false)
    expect(isValidString('--')).toBe(false)
    expect(isValidString(';')).toBe(false)
  })

  it('Should allow numbers', () => {
    expect(isValidString('1')).toBe(true)
  })

  it('Should allow text', () => {
    expect(isValidString('Some text')).toBe(true)
  })

  it('Should allow quotes', () => {
    expect(isValidString('"')).toBe(true)
    expect(isValidString('«»')).toBe(true)
  })
})
