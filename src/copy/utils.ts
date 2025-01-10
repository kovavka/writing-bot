export function getWordForm(
  amount: number,
  forms: readonly [string, string, string]
): string {
  const amountAbs = Math.abs(amount)
  if (amountAbs % 10 === 1 && amountAbs % 100 !== 11) {
    return forms[0]
  }
  if (
    amountAbs % 10 > 1 &&
    amountAbs % 10 < 5 &&
    (amountAbs % 100 < 10 || amountAbs % 100 > 20)
  ) {
    return forms[1]
  }

  return forms[2]
}
