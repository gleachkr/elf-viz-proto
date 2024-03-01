export function makeElfData(dataView) {
  const is64Bit = dataView.getUint8(4) === 2
  const isBigendian = dataView.getUint8(5) === 2
  return {
    is64Bit, isBigendian,
    e_entry: readBytes(dataView, 0x18, is64Bit ? 8 : 4, isBigendian),
    e_phoff: readBytes(dataView, is64Bit ? 0x20 : 0x1c, is64Bit ? 8 : 4, isBigendian),
    e_phentsize: readBytes(dataView, is64Bit ? 0x36 : 0x2a, 2, isBigendian),
    e_phnum: readBytes(dataView, is64Bit ? 0x38 : 0x2c, 2, isBigendian),
    e_shoff: readBytes(dataView, is64Bit ? 0x28 : 0x20, is64Bit ? 8 : 4, isBigendian),
    e_shentsize: readBytes(dataView, is64Bit ? 0x3a : 0x2e, 2, isBigendian),
    e_shnum: readBytes(dataView, is64Bit ? 0x3c : 0x30, 2, isBigendian)
  }
}

export function makePHData(dataView, offset) {
  const is64Bit = dataView.getUint8(4) === 2
  const isBigendian = dataView.getUint8(5) === 2
  return {
    p_type: readBytes(dataView, offset, 4, isBigendian),
    p_flags: readBytes(dataView, offset + (is64Bit ? 0x4 : 0x18), 4, isBigendian),
    p_offset: readBytes(dataView, offset + (is64Bit ? 0x8 : 0x4), is64Bit ? 8 : 4, isBigendian),
    p_vaddr: readBytes(dataView, offset + (is64Bit ? 0x10 : 0x8), is64Bit ? 8 : 4, isBigendian),
    p_paddr: readBytes(dataView, offset + (is64Bit ? 0x18 : 0xc), is64Bit ? 8 : 4, isBigendian),
    p_filesz: readBytes(dataView, offset + (is64Bit ? 0x20 : 0x10), is64Bit ? 8 : 4, isBigendian),
    p_memsz: readBytes(dataView, offset + (is64Bit ? 0x28 : 0x14), is64Bit ? 8 : 4, isBigendian),
    p_align: readBytes(dataView, offset + (is64Bit ? 0x30 : 0x1c), is64Bit ? 8 : 4, isBigendian)
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
