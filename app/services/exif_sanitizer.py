def strip_exif_markers(data: bytes) -> bytes:
    length = len(data)
    if length < 4 or data[0:2] != b"\xff\xd8":
        return data

    offset = 2
    chunks = [data[:2]]

    while offset < length - 1:
        if data[offset] == 0xFF:
            marker = data[offset + 1]

            if marker in (0xDA, 0xD9):
                chunks.append(data[offset:])
                break

            if marker == 0x01 or (0xD0 <= marker <= 0xD7):
                chunks.append(data[offset : offset + 2])
                offset += 2
                continue

            if offset + 4 > length:
                break

            segment_length = int.from_bytes(data[offset + 2 : offset + 4], byteorder="big")

            if marker == 0xE1:
                offset += 2 + segment_length
                continue

            chunks.append(data[offset : offset + 2 + segment_length])
            offset += 2 + segment_length
        else:
            offset += 1

    return b"".join(chunks)

def sanitize_image_bytes(data: bytes, filename: str = "") -> bytes:
    if filename and not filename.lower().endswith((".jpg", ".jpeg")):
        return data
    return strip_exif_markers(data)
