import { isValidNumber } from '../bot/utils'

describe('isValidNumber', () => {
  it('Should be number', () => {
    expect(isValidNumber('12')).toBe(true)
    expect(isValidNumber('1fgg')).toBe(false)
    expect(isValidNumber('text')).toBe(false)
  })

  it('Should not allow negative numbers', () => {
    expect(isValidNumber('-12')).toBe(false)
  })

  it('Should allow 0', () => {
    expect(isValidNumber('0')).toBe(true)
  })

  it('Should not allow numbers grater than 99.9 millions', () => {
    expect(isValidNumber('99999999')).toBe(true)
    expect(isValidNumber('100000000')).toBe(false)
  })
})
