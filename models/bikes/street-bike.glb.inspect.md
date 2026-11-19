
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
| #   | name            | rootName        | bboxMin                     | bboxMax                  | renderVertexCount¹ | uploadVertexCount | uploadNaiveVertexCount |
| --- | ---             | ---             | ---                         | ---                      | ---                | ---               | ---                    |
| 0   | Sketchfab_Scene | Sketchfab_model | -0.3159, -0.74343, -1.20181 | 0.3159, 0.74344, 1.20181 | 209,724            | 49,783            | 49,783                 |

¹ Expected number of vertices processed by the vertex shader for one render
  pass, without considering the vertex cache.

² Expected number of vertices uploaded to GPU, assuming each Accessor
  is uploaded only once. Actual number uploaded may be higher, 
  dependent on the implementation and vertex buffer layout.

³ Expected number of vertices uploaded to GPU, assuming each Primitive
  is uploaded once, duplicating vertex attributes shared among Primitives.



 MESHES
 ────────────────────────────────────────────
| #   | name            | mode      | meshPrimitives | glPrimitives | vertices | indices | attributes                                                                | instances | size¹     |
| --- | ---             | ---       | ---            | ---          | ---      | ---     | ---                                                                       | ---       | ---       |
| 0   | defaultMaterial | TRIANGLES | 1              | 3,264        | 1,997    | u16     | NORMAL:i16_norm, POSITION:i16_norm, TANGENT:i16_norm, TEXCOORD_0:u16_norm | 1         | 67.51 KB  |
| 1   | defaultMaterial | TRIANGLES | 1              | 5,120        | 3,448    | u16     | NORMAL:i16_norm, POSITION:i16_norm, TANGENT:i16_norm, TEXCOORD_0:u16_norm | 1         | 113.47 KB |
| 2   | defaultMaterial | TRIANGLES | 1              | 19,552       | 11,433   | u16     | NORMAL:i16_norm, POSITION:i16_norm, TANGENT:i16_norm, TEXCOORD_0:u16_norm | 1         | 391.7 KB  |
| 3   | defaultMaterial | TRIANGLES | 1              | 10,904       | 7,099    | u16     | NORMAL:i16_norm, POSITION:i16_norm, TANGENT:i16_norm, TEXCOORD_0:u16_norm | 1         | 235.8 KB  |
| 4   | defaultMaterial | TRIANGLES | 1              | 13,868       | 12,406   | u16     | NORMAL:i16_norm, POSITION:i16_norm, TANGENT:i16_norm, TEXCOORD_0:u16_norm | 1         | 380.95 KB |
| 5   | defaultMaterial | TRIANGLES | 1              | 704          | 394      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TANGENT:i16_norm, TEXCOORD_0:u16_norm | 1         | 13.68 KB  |
| 6   | defaultMaterial | TRIANGLES | 1              | 15,488       | 12,296   | u16     | NORMAL:i16_norm, POSITION:i16_norm, TANGENT:i16_norm, TEXCOORD_0:u16_norm | 1         | 388.03 KB |
| 7   | defaultMaterial | TRIANGLES | 1              | 1,008        | 710      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TANGENT:i16_norm, TEXCOORD_0:u16_norm | 1         | 23.09 KB  |

⁴ size estimates GPU memory required by a mesh, in isolation. If accessors are
  shared by other mesh primitives, but the meshes themselves are not reused, then
  the sum of all mesh sizes will overestimate the asset's total size. See "dedup".



 MATERIALS
 ────────────────────────────────────────────
| #   | name        | instances | textures                                                                                     | alphaMode | doubleSided |
| --- | ---         | ---       | ---                                                                                          | ---       | ---         |
| 0   | Lights      | 1         | baseColorTexture, emissiveTexture, normalTexture, occlusionTexture, metallicRoughnessTexture | OPAQUE    | ✓           |
| 1   | Shiny_props | 1         | baseColorTexture, normalTexture, occlusionTexture, metallicRoughnessTexture                  | OPAQUE    | ✓           |
| 2   | Glass       | 1         | baseColorTexture, normalTexture, occlusionTexture, metallicRoughnessTexture                  | BLEND     | ✓           |
| 3   | Black_props | 1         | baseColorTexture, normalTexture, occlusionTexture, metallicRoughnessTexture                  | OPAQUE    | ✓           |
| 4   | Engine1     | 1         | baseColorTexture, normalTexture, occlusionTexture, metallicRoughnessTexture                  | OPAQUE    | ✓           |
| 5   | Main2       | 1         | baseColorTexture, normalTexture, occlusionTexture, metallicRoughnessTexture                  | OPAQUE    | ✓           |
| 6   | Wheels      | 1         | baseColorTexture, normalTexture, occlusionTexture, metallicRoughnessTexture                  | OPAQUE    | ✓           |
| 7   | Main        | 1         | baseColorTexture, normalTexture, occlusionTexture, metallicRoughnessTexture                  | OPAQUE    | ✓           |



 TEXTURES
 ────────────────────────────────────────────
| #   | name | uri | slots                                      | instances | mimeType   | compression | resolution | size      | gpuSize⁵ |
| --- | ---  | --- | ---                                        | ---       | ---        | ---         | ---        | ---       | ---      |
| 0   |      |     | baseColorTexture                           | 1         | image/jpeg |             | 1024x1024  | 24.66 KB  | 5.59 MB  |
| 1   |      |     | occlusionTexture, metallicRoughnessTexture | 1         | image/jpeg |             | 1024x1024  | 35.61 KB  | 5.59 MB  |
| 2   |      |     | emissiveTexture                            | 1         | image/jpeg |             | 1024x1024  | 27.42 KB  | 5.59 MB  |
| 3   |      |     | normalTexture                              | 1         | image/jpeg |             | 1024x1024  | 17.35 KB  | 5.59 MB  |
| 4   |      |     | baseColorTexture                           | 1         | image/jpeg |             | 1024x1024  | 72.81 KB  | 5.59 MB  |
| 5   |      |     | occlusionTexture, metallicRoughnessTexture | 1         | image/jpeg |             | 1024x1024  | 92.17 KB  | 5.59 MB  |
| 6   |      |     | normalTexture                              | 1         | image/jpeg |             | 1024x1024  | 27.98 KB  | 5.59 MB  |
| 7   |      |     | baseColorTexture                           | 1         | image/png  |             | 1024x1024  | 17.11 KB  | 5.59 MB  |
| 8   |      |     | occlusionTexture, metallicRoughnessTexture | 1         | image/jpeg |             | 1024x1024  | 37.9 KB   | 5.59 MB  |
| 9   |      |     | normalTexture                              | 1         | image/jpeg |             | 1024x1024  | 22.61 KB  | 5.59 MB  |
| 10  |      |     | baseColorTexture                           | 1         | image/jpeg |             | 1024x1024  | 46.83 KB  | 5.59 MB  |
| 11  |      |     | occlusionTexture, metallicRoughnessTexture | 1         | image/jpeg |             | 1024x1024  | 95.4 KB   | 5.59 MB  |
| 12  |      |     | normalTexture                              | 1         | image/jpeg |             | 1024x1024  | 30.23 KB  | 5.59 MB  |
| 13  |      |     | baseColorTexture                           | 1         | image/jpeg |             | 1024x1024  | 116.64 KB | 5.59 MB  |
| 14  |      |     | occlusionTexture, metallicRoughnessTexture | 1         | image/jpeg |             | 1024x1024  | 124.65 KB | 5.59 MB  |
| 15  |      |     | normalTexture                              | 1         | image/jpeg |             | 1024x1024  | 21.84 KB  | 5.59 MB  |
| 16  |      |     | baseColorTexture                           | 1         | image/jpeg |             | 1024x1024  | 17.83 KB  | 5.59 MB  |
| 17  |      |     | occlusionTexture, metallicRoughnessTexture | 1         | image/jpeg |             | 1024x1024  | 65.13 KB  | 5.59 MB  |
| 18  |      |     | normalTexture                              | 1         | image/jpeg |             | 1024x1024  | 18.24 KB  | 5.59 MB  |
| 19  |      |     | baseColorTexture                           | 1         | image/jpeg |             | 1024x1024  | 17.01 KB  | 5.59 MB  |
| 20  |      |     | occlusionTexture, metallicRoughnessTexture | 1         | image/jpeg |             | 1024x1024  | 174.91 KB | 5.59 MB  |
| 21  |      |     | normalTexture                              | 1         | image/jpeg |             | 1024x1024  | 90.41 KB  | 5.59 MB  |
| 22  |      |     | baseColorTexture                           | 1         | image/jpeg |             | 512x512    | 5.05 KB   | 1.4 MB   |
| 23  |      |     | occlusionTexture, metallicRoughnessTexture | 1         | image/jpeg |             | 512x512    | 15.69 KB  | 1.4 MB   |
| 24  |      |     | normalTexture                              | 1         | image/jpeg |             | 512x512    | 7 KB      | 1.4 MB   |

⁵ gpuSize estimates minimum VRAM memory allocation. Older devices may require
  additional memory for GPU compression formats.



 ANIMATIONS
 ────────────────────────────────────────────
No animations found.

