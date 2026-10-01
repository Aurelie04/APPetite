package com.appetite.restaurant;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Optional;

/**
 * Detects the image type from the file's magic bytes rather than trusting the client-supplied
 * content type or file extension. SVG is deliberately not supported because it can carry scripts.
 */
final class ImageTypes {

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'};
    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] GIF87 = "GIF87a".getBytes(StandardCharsets.US_ASCII);
    private static final byte[] GIF89 = "GIF89a".getBytes(StandardCharsets.US_ASCII);
    private static final byte[] RIFF = "RIFF".getBytes(StandardCharsets.US_ASCII);
    private static final byte[] WEBP = "WEBP".getBytes(StandardCharsets.US_ASCII);

    private ImageTypes() {
    }

    static Optional<String> detect(byte[] data) {
        if (startsWith(data, 0, PNG)) return Optional.of("image/png");
        if (startsWith(data, 0, JPEG)) return Optional.of("image/jpeg");
        if (startsWith(data, 0, GIF87) || startsWith(data, 0, GIF89)) return Optional.of("image/gif");
        if (startsWith(data, 0, RIFF) && startsWith(data, 8, WEBP)) return Optional.of("image/webp");
        return Optional.empty();
    }

    private static boolean startsWith(byte[] data, int offset, byte[] prefix) {
        return data.length >= offset + prefix.length
                && Arrays.equals(data, offset, offset + prefix.length, prefix, 0, prefix.length);
    }
}
