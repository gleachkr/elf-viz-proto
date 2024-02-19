export function makeElfData(dataView) {
  const is64Bit = dataView.getUint8(4) === 2
  const isBigendian = dataView.getUint8(5) === 2
  return { is64Bit, isBigendian,
    e_entry: readBytes(dataView, 0x18, is64Bit ? 8 : 4, isBigendian),
    e_phoff: readBytes(dataView, is64Bit ? 0x20 : 0x1c, is64Bit ? 8 : 4, isBigendian),
    e_phentsize: readBytes(dataView, is64Bit ? 0x36 : 0x2a, 2, isBigendian),
    e_phnum: readBytes(dataView,is64Bit ? 0x38 : 0x2c, 2, isBigendian),
    e_shoff: readBytes(dataView,is64Bit ? 0x28 : 0x20, is64Bit ? 8 : 4, isBigendian),
    e_shentsize: readBytes(dataView, is64Bit ? 0x3a : 0x2e, 2, isBigendian),
    e_shnum: readBytes(dataView, is64Bit ? 0x3c : 0x30, 2, isBigendian)
  }
}

export function readBytes(view, offset, total, isBigendian) {
  let sum = 0;
  if (isBigendian) {
    let count = 0
    for (let i = offset + total - 1; i >= offset; i--) {
      sum += view.getUint8(i) * (2 ** (count * 8))
      count++
    }
  } else {
    let count = 0
    for (let i = offset; i < offset + total; i++) {
      sum += view.getUint8(i) * (2 ** (count * 8))
      count++
    }
  }
  return sum
}
