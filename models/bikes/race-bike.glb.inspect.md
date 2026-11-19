
 OVERVIEW
 ────────────────────────────────────────────
| key                | value                                          |
| ---                | ---                                            |
| version            | 2.0                                            |
| generator          | glTF-Transform v4.5.1                          |
| extensionsUsed     | EXT_meshopt_compression, KHR_mesh_quantization |
| extensionsRequired | EXT_meshopt_compression, KHR_mesh_quantization |



 SCENES
 ────────────────────────────────────────────
| #   | name            | rootName        | bboxMin                   | bboxMax                | renderVertexCount¹ | uploadVertexCount | uploadNaiveVertexCount |
| --- | ---             | ---             | ---                       | ---                    | ---                | ---               | ---                    |
| 0   | Sketchfab_Scene | Sketchfab_model | -1.25, -0.71011, -0.39677 | 1.25, 0.71009, 0.39676 | 174,405            | 50,410            | 51,226                 |

¹ Expected number of vertices processed by the vertex shader for one render
  pass, without considering the vertex cache.

² Expected number of vertices uploaded to GPU, assuming each Accessor
  is uploaded only once. Actual number uploaded may be higher, 
  dependent on the implementation and vertex buffer layout.

³ Expected number of vertices uploaded to GPU, assuming each Primitive
  is uploaded once, duplicating vertex attributes shared among Primitives.



 MESHES
 ────────────────────────────────────────────
| #   | name      | mode      | meshPrimitives | glPrimitives | vertices | indices | attributes                                         | instances | size¹     |
| --- | ---       | ---       | ---            | ---          | ---      | ---     | ---                                                | ---       | ---       |
| 0   | Object_0  | TRIANGLES | 1              | 70           | 86       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32 | 1         | 2.14 KB   |
| 1   | Object_1  | TRIANGLES | 1              | 140          | 92       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32 | 1         | 2.68 KB   |
| 2   | Object_2  | TRIANGLES | 1              | 672          | 522      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32 | 1         | 14.47 KB  |
| 3   | Object_3  | TRIANGLES | 1              | 168          | 252      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32 | 1         | 6.05 KB   |
| 4   | Object_4  | TRIANGLES | 1              | 336          | 252      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32 | 1         | 7.06 KB   |
| 5   | Object_5  | TRIANGLES | 1              | 2,201        | 1,576    | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32 | 1         | 44.73 KB  |
| 6   | Object_6  | TRIANGLES | 1              | 2,201        | 1,574    | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32 | 1         | 44.69 KB  |
| 7   | Object_7  | TRIANGLES | 1              | 3,588        | 2,717    | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32 | 1         | 75.87 KB  |
| 8   | Object_8  | TRIANGLES | 1              | 3,017        | 2,170    | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32 | 1         | 61.5 KB   |
| 9   | Object_9  | TRIANGLES | 1              | 1,588        | 1,303    | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32 | 1         | 35.59 KB  |
| 10  | Object_10 | TRIANGLES | 1              | 1,725        | 1,437    | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32 | 1         | 39.09 KB  |
| 11  | Object_11 | TRIANGLES | 1              | 11,827       | 9,578    | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32 | 1         | 262.52 KB |
| 12  | Object_12 | TRIANGLES | 1              | 176          | 126      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32 | 1         | 3.58 KB   |
| 13  | Object_13 | TRIANGLES | 1              | 248          | 164      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32 | 1         | 4.77 KB   |
| 14  | Object_14 | TRIANGLES | 1              | 1,166        | 1,772    | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32 | 1         | 42.44 KB  |
| 15  | Object_15 | TRIANGLES | 1              | 1,566        | 1,658    | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32 | 1         | 42.56 KB  |
| 16  | Object_16 | TRIANGLES | 1              | 1,576        | 1,674    | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32 | 1         | 42.94 KB  |
| 17  | Object_17 | TRIANGLES | 1              | 2,914        | 2,647    | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32 | 1         | 70.42 KB  |
| 18  | Object_18 | TRIANGLES | 1              | 3,671        | 3,211    | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32 | 1         | 86.25 KB  |
| 19  | Object_19 | TRIANGLES | 1              | 749          | 825      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32 | 1         | 20.99 KB  |
| 20  | Object_20 | TRIANGLES | 1              | 165          | 189      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32 | 1         | 4.77 KB   |
| 21  | Object_21 | TRIANGLES | 1              | 9,295        | 9,811    | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32 | 1         | 251.99 KB |
| 22  | Object_22 | TRIANGLES | 1              | 118          | 77       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32 | 1         | 2.25 KB   |
| 23  | Object_23 | TRIANGLES | 1              | 56           | 41       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32 | 1         | 1.16 KB   |
| 24  | Object_24 | TRIANGLES | 1              | 522          | 118      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32 | 1         | 5.49 KB   |
| 25  | Object_25 | TRIANGLES | 1              | 3,428        | 3,144    | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32 | 1         | 83.45 KB  |
| 26  | Object_26 | TRIANGLES | 1              | 1,496        | 1,434    | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32 | 1         | 37.66 KB  |
| 27  | Object_27 | TRIANGLES | 1              | 1,024        | 816      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32 | 1         | 22.46 KB  |
| 28  | Object_28 | TRIANGLES | 1              | 1,408        | 1,144    | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32 | 1         | 31.33 KB  |
| 29  | Object_29 | TRIANGLES | 1              | 1,024        | 816      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32 | 1         | 22.46 KB  |

⁴ size estimates GPU memory required by a mesh, in isolation. If accessors are
  shared by other mesh primitives, but the meshes themselves are not reused, then
  the sum of all mesh sizes will overestimate the asset's total size. See "dedup".



 MATERIALS
 ────────────────────────────────────────────
| #   | name          | instances | textures         | alphaMode | doubleSided |
| --- | ---           | ---       | ---              | ---       | ---         |
| 0   | blurred       | 1         | baseColorTexture | OPAQUE    | ✓           |
| 1   | blurred_BCD   | 1         | baseColorTexture | OPAQUE    | ✓           |
| 2   | brake         | 1         | baseColorTexture | OPAQUE    | ✓           |
| 3   | chain         | 1         | baseColorTexture | OPAQUE    | ✓           |
| 4   | chain_BCD     | 1         | baseColorTexture | OPAQUE    | ✓           |
| 5   | chassis1      | 1         | baseColorTexture | OPAQUE    | ✓           |
| 6   | chassis2      | 1         | baseColorTexture | OPAQUE    | ✓           |
| 7   | chassis3      | 1         | baseColorTexture | OPAQUE    | ✓           |
| 8   | chassis4      | 1         | baseColorTexture | OPAQUE    | ✓           |
| 9   | chassis5      | 1         | baseColorTexture | OPAQUE    | ✓           |
| 10  | chassis6      | 1         | baseColorTexture | OPAQUE    | ✓           |
| 11  | chassis_BCD   | 1         | baseColorTexture | OPAQUE    | ✓           |
| 12  | glass_1_2     | 1         | baseColorTexture | OPAQUE    | ✓           |
| 13  | glass_BCD     | 1         | baseColorTexture | OPAQUE    | ✓           |
| 14  | lod_EF        | 1         | baseColorTexture | OPAQUE    | ✓           |
| 15  | mech1         | 1         | baseColorTexture | OPAQUE    | ✓           |
| 16  | mech2         | 1         | baseColorTexture | OPAQUE    | ✓           |
| 17  | mech3         | 1         | baseColorTexture | OPAQUE    | ✓           |
| 18  | mech4         | 1         | baseColorTexture | OPAQUE    | ✓           |
| 19  | mech5         | 1         | baseColorTexture | OPAQUE    | ✓           |
| 20  | mech6         | 1         | baseColorTexture | OPAQUE    | ✓           |
| 21  | mechanics_BCD | 1         | baseColorTexture | OPAQUE    | ✓           |
| 22  | number_1_2    | 1         | baseColorTexture | OPAQUE    | ✓           |
| 23  | number_5_6    | 1         | baseColorTexture | OPAQUE    | ✓           |
| 24  | number_BCD    | 1         | baseColorTexture | OPAQUE    | ✓           |
| 25  | material      | 1         | baseColorTexture | OPAQUE    | ✓           |
| 26  | rim_BCD       | 1         | baseColorTexture | OPAQUE    | ✓           |
| 27  | tyre          | 1         | baseColorTexture | OPAQUE    | ✓           |
| 28  | tyre_BCD      | 1         | baseColorTexture | OPAQUE    | ✓           |
| 29  | tyre_dirt     | 1         | baseColorTexture | OPAQUE    | ✓           |



 TEXTURES
 ────────────────────────────────────────────
| #   | name | uri | slots            | instances | mimeType   | compression | resolution | size      | gpuSize⁵  |
| --- | ---  | --- | ---              | ---       | ---        | ---         | ---        | ---       | ---       |
| 0   |      |     | baseColorTexture | 2         | image/jpeg |             | 256x256    | 6.02 KB   | 349.52 KB |
| 1   |      |     | baseColorTexture | 1         | image/jpeg |             | 128x256    | 10.97 KB  | 174.76 KB |
| 2   |      |     | baseColorTexture | 2         | image/jpeg |             | 128x128    | 2.58 KB   | 87.38 KB  |
| 3   |      |     | baseColorTexture | 7         | image/jpeg |             | 1024x1024  | 149.41 KB | 5.59 MB   |
| 4   |      |     | baseColorTexture | 2         | image/jpeg |             | 256x256    | 2.21 KB   | 349.52 KB |
| 5   |      |     | baseColorTexture | 1         | image/jpeg |             | 128x128    | 883 Bytes | 87.38 KB  |
| 6   |      |     | baseColorTexture | 7         | image/jpeg |             | 1024x1024  | 111.98 KB | 5.59 MB   |
| 7   |      |     | baseColorTexture | 3         | image/jpeg |             | 256x256    | 1.65 KB   | 349.52 KB |
| 8   |      |     | baseColorTexture | 2         | image/jpeg |             | 256x256    | 5.72 KB   | 349.52 KB |
| 9   |      |     | baseColorTexture | 2         | image/jpeg |             | 8x8        | 639 Bytes | 340 Bytes |
| 10  |      |     | baseColorTexture | 1         | image/jpeg |             | 8x8        | 648 Bytes | 340 Bytes |

⁵ gpuSize estimates minimum VRAM memory allocation. Older devices may require
  additional memory for GPU compression formats.



 ANIMATIONS
 ────────────────────────────────────────────
No animations found.

