
 OVERVIEW
 ────────────────────────────────────────────
| key                | value                                                                                      |
| ---                | ---                                                                                        |
| version            | 2.0                                                                                        |
| generator          | glTF-Transform v4.5.1                                                                      |
| extensionsUsed     | EXT_meshopt_compression, KHR_materials_unlit, KHR_mesh_quantization, KHR_texture_transform |
| extensionsRequired | EXT_meshopt_compression, KHR_mesh_quantization                                             |



 SCENES
 ────────────────────────────────────────────
| #   | name     | rootName       | bboxMin              | bboxMax                 | renderVertexCount¹ | uploadVertexCount | uploadNaiveVertexCount |
| --- | ---      | ---            | ---                  | ---                     | ---                | ---               | ---                    |
| 0   | AuxScene | ApexArcadePark | -170, -1.00014, -300 | 170, 62.69151, 70.18528 | 233,925            | 135,129           | 155,700                |

¹ Expected number of vertices processed by the vertex shader for one render
  pass, without considering the vertex cache.

² Expected number of vertices uploaded to GPU, assuming each Accessor
  is uploaded only once. Actual number uploaded may be higher, 
  dependent on the implementation and vertex buffer layout.

³ Expected number of vertices uploaded to GPU, assuming each Primitive
  is uploaded once, duplicating vertex attributes shared among Primitives.



 MESHES
 ────────────────────────────────────────────
| #   | name | mode      | meshPrimitives | glPrimitives | vertices | indices | attributes                                              | instances | size¹     |
| --- | ---  | ---       | ---            | ---          | ---      | ---     | ---                                                     | ---       | ---       |
| 0   |      | TRIANGLES | 1              | 2            | 4        | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 76 Bytes  |
| 1   |      | TRIANGLES | 1              | 160          | 244      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 4.86 KB   |
| 2   |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 3   |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 4   |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 5   |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 6   |      | TRIANGLES | 1              | 3            | 5        | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 118 Bytes |
| 7   |      | TRIANGLES | 1              | 96           | 148      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.94 KB   |
| 8   |      | TRIANGLES | 1              | 96           | 148      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.94 KB   |
| 9   |      | TRIANGLES | 1              | 360          | 362      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 9.4 KB    |
| 10  |      | TRIANGLES | 1              | 48           | 76       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.5 KB    |
| 11  |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 12  |      | TRIANGLES | 1              | 48           | 76       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.5 KB    |
| 13  |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 14  |      | TRIANGLES | 1              | 2            | 4        | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 76 Bytes  |
| 15  |      | TRIANGLES | 1              | 2            | 4        | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 76 Bytes  |
| 16  |      | TRIANGLES | 1              | 2            | 4        | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 76 Bytes  |
| 17  |      | TRIANGLES | 1              | 2            | 4        | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 76 Bytes  |
| 18  |      | TRIANGLES | 1              | 2            | 4        | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 76 Bytes  |
| 19  |      | TRIANGLES | 1              | 13,176       | 39,528   |         | COLOR_0:u8_norm, NORMAL:i16_norm, POSITION:i16_norm     | 1         | 592.92 KB |
| 20  |      | TRIANGLES | 1              | 1,672        | 5,016    |         | COLOR_0:u8_norm, NORMAL:i16_norm, POSITION:i16_norm     | 1         | 75.24 KB  |
| 21  |      | TRIANGLES | 1              | 1,672        | 5,016    |         | COLOR_0:u8_norm, NORMAL:i16_norm, POSITION:i16_norm     | 1         | 75.24 KB  |
| 22  |      | TRIANGLES | 1              | 13,688       | 41,064   |         | COLOR_0:u8_norm, NORMAL:i16_norm, POSITION:i16_norm     | 1         | 615.96 KB |
| 23  |      | TRIANGLES | 1              | 184          | 186      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 4.82 KB   |
| 24  |      | TRIANGLES | 1              | 184          | 186      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 4.82 KB   |
| 25  |      | TRIANGLES | 1              | 120          | 122      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 3.16 KB   |
| 26  |      | TRIANGLES | 1              | 664          | 666      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 17.3 KB   |
| 27  |      | TRIANGLES | 1              | 488          | 490      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 12.73 KB  |
| 28  |      | TRIANGLES | 1              | 488          | 490      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 12.73 KB  |
| 29  |      | TRIANGLES | 1              | 472          | 474      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 12.31 KB  |
| 30  |      | TRIANGLES | 1              | 472          | 474      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 12.31 KB  |
| 31  |      | TRIANGLES | 1              | 488          | 490      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 12.73 KB  |
| 32  |      | TRIANGLES | 1              | 472          | 474      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 12.31 KB  |
| 33  |      | TRIANGLES | 1              | 1,296        | 652      | u16     | NORMAL:i16_norm, POSITION:i16_norm                      | 1         | 15.6 KB   |
| 34  |      | TRIANGLES | 1              | 1,256        | 632      | u16     | NORMAL:i16_norm, POSITION:i16_norm                      | 1         | 15.12 KB  |
| 35  |      | TRIANGLES | 1              | 472          | 474      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 12.31 KB  |
| 36  |      | TRIANGLES | 1              | 1,280        | 644      | u16     | NORMAL:i16_norm, POSITION:i16_norm                      | 1         | 15.41 KB  |
| 37  |      | TRIANGLES | 1              | 480          | 482      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 12.52 KB  |
| 38  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 39  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 40  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 41  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 42  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 43  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 44  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 45  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 46  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 47  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 48  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 49  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 50  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 51  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 52  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 53  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 54  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 55  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 56  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 57  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 58  |      | TRIANGLES | 1              | 480          | 482      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 12.52 KB  |
| 59  |      | TRIANGLES | 1              | 120          | 122      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.67 KB   |
| 60  |      | TRIANGLES | 1              | 88           | 90       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 2.33 KB   |
| 61  |      | TRIANGLES | 1              | 88           | 90       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 2.33 KB   |
| 62  |      | TRIANGLES | 1              | 88           | 90       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 2.33 KB   |
| 63  |      | TRIANGLES | 1              | 88           | 90       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 2.33 KB   |
| 64  |      | TRIANGLES | 1              | 160          | 162      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 4.2 KB    |
| 65  |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 66  |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 67  |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 68  |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 69  |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 70  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 71  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 72  |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 73  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 74  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 75  |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 76  |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 77  |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 78  |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 79  |      | TRIANGLES | 1              | 216          | 141      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.55 KB   |
| 80  |      | TRIANGLES | 1              | 180          | 116      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.94 KB   |
| 81  |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 82  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 83  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 84  |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 85  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 86  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 87  |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 88  |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 89  |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 90  |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 91  |      | TRIANGLES | 1              | 216          | 141      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.55 KB   |
| 92  |      | TRIANGLES | 1              | 180          | 116      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.94 KB   |
| 93  |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 94  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 95  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 96  |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 97  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 98  |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 99  |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 100 |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 101 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 102 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 103 |      | TRIANGLES | 1              | 216          | 141      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.55 KB   |
| 104 |      | TRIANGLES | 1              | 180          | 116      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.94 KB   |
| 105 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 106 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 107 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 108 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 109 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 110 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 111 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 112 |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 113 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 114 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 115 |      | TRIANGLES | 1              | 216          | 141      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.55 KB   |
| 116 |      | TRIANGLES | 1              | 180          | 116      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.94 KB   |
| 117 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 118 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 119 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 120 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 121 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 122 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 123 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 124 |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 125 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 126 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 127 |      | TRIANGLES | 1              | 216          | 141      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.55 KB   |
| 128 |      | TRIANGLES | 1              | 180          | 116      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.94 KB   |
| 129 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 130 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 131 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 132 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 133 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 134 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 135 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 136 |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 137 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 138 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 139 |      | TRIANGLES | 1              | 216          | 141      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.55 KB   |
| 140 |      | TRIANGLES | 1              | 180          | 116      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.94 KB   |
| 141 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 142 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 143 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 144 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 145 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 146 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 147 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 148 |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 149 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 150 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 151 |      | TRIANGLES | 1              | 216          | 141      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.55 KB   |
| 152 |      | TRIANGLES | 1              | 180          | 116      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.94 KB   |
| 153 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 154 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 155 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 156 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 157 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 158 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 159 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 160 |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 161 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 162 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 163 |      | TRIANGLES | 1              | 216          | 141      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.55 KB   |
| 164 |      | TRIANGLES | 1              | 180          | 116      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.94 KB   |
| 165 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 166 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 167 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 168 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 169 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 170 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 171 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 172 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 173 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 174 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 175 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 176 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 177 |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 178 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 179 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 180 |      | TRIANGLES | 1              | 216          | 141      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.55 KB   |
| 181 |      | TRIANGLES | 1              | 180          | 116      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.94 KB   |
| 182 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 183 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 184 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 185 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 186 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 187 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 188 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 189 |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 190 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 191 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 192 |      | TRIANGLES | 1              | 216          | 141      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.55 KB   |
| 193 |      | TRIANGLES | 1              | 180          | 116      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.94 KB   |
| 194 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 195 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 196 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 197 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 198 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 199 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 200 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 201 |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 202 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 203 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 204 |      | TRIANGLES | 1              | 216          | 141      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.55 KB   |
| 205 |      | TRIANGLES | 1              | 180          | 116      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.94 KB   |
| 206 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 207 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 208 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 209 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 210 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 211 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 212 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 213 |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 214 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 215 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 216 |      | TRIANGLES | 1              | 216          | 141      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.55 KB   |
| 217 |      | TRIANGLES | 1              | 180          | 116      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.94 KB   |
| 218 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 219 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 220 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 221 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 222 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 223 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 224 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 225 |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 226 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 227 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 228 |      | TRIANGLES | 1              | 216          | 141      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.55 KB   |
| 229 |      | TRIANGLES | 1              | 180          | 116      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.94 KB   |
| 230 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 231 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 232 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 233 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 234 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 235 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 236 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 237 |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 238 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 239 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 240 |      | TRIANGLES | 1              | 216          | 141      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.55 KB   |
| 241 |      | TRIANGLES | 1              | 180          | 116      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.94 KB   |
| 242 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 243 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 244 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 245 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 246 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 247 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 248 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 249 |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 250 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 251 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 252 |      | TRIANGLES | 1              | 216          | 141      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.55 KB   |
| 253 |      | TRIANGLES | 1              | 180          | 116      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.94 KB   |
| 254 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 255 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 256 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 257 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 258 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 259 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 260 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 261 |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 262 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 263 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 264 |      | TRIANGLES | 1              | 216          | 141      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.55 KB   |
| 265 |      | TRIANGLES | 1              | 180          | 116      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.94 KB   |
| 266 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 267 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 268 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 269 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 270 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 271 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 272 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 273 |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 274 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 275 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 276 |      | TRIANGLES | 1              | 216          | 141      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.55 KB   |
| 277 |      | TRIANGLES | 1              | 180          | 116      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.94 KB   |
| 278 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 279 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 280 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 281 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 282 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 283 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 284 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 285 |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 286 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 287 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 288 |      | TRIANGLES | 1              | 216          | 141      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.55 KB   |
| 289 |      | TRIANGLES | 1              | 180          | 116      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.94 KB   |
| 290 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 291 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 292 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 293 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 294 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 295 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 296 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 297 |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 298 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 299 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 300 |      | TRIANGLES | 1              | 216          | 141      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.55 KB   |
| 301 |      | TRIANGLES | 1              | 180          | 116      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.94 KB   |
| 302 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 303 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 304 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 305 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 306 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 307 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 308 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 309 |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 310 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 311 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 312 |      | TRIANGLES | 1              | 216          | 141      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.55 KB   |
| 313 |      | TRIANGLES | 1              | 180          | 116      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.94 KB   |
| 314 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 315 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 316 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 317 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 318 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 319 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 320 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 321 |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 322 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 323 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 324 |      | TRIANGLES | 1              | 216          | 141      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.55 KB   |
| 325 |      | TRIANGLES | 1              | 180          | 116      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.94 KB   |
| 326 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 327 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 328 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 329 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 330 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 331 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 332 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 333 |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 334 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 335 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 336 |      | TRIANGLES | 1              | 216          | 141      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.55 KB   |
| 337 |      | TRIANGLES | 1              | 180          | 116      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.94 KB   |
| 338 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 339 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 340 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 341 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 342 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 343 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 344 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 345 |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 346 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 347 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 348 |      | TRIANGLES | 1              | 216          | 141      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.55 KB   |
| 349 |      | TRIANGLES | 1              | 180          | 116      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.94 KB   |
| 350 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 351 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 352 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 353 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 354 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 355 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 356 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 357 |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 358 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 359 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 360 |      | TRIANGLES | 1              | 216          | 141      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.55 KB   |
| 361 |      | TRIANGLES | 1              | 180          | 116      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.94 KB   |
| 362 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 363 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 364 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 365 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 366 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 367 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 368 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 369 |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 370 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 371 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 372 |      | TRIANGLES | 1              | 216          | 141      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.55 KB   |
| 373 |      | TRIANGLES | 1              | 180          | 116      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.94 KB   |
| 374 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 375 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 376 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 377 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 378 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 379 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 380 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 381 |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 382 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 383 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 384 |      | TRIANGLES | 1              | 216          | 141      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.55 KB   |
| 385 |      | TRIANGLES | 1              | 180          | 116      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.94 KB   |
| 386 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 387 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 388 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 389 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 390 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 391 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 392 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 393 |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 394 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 395 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 396 |      | TRIANGLES | 1              | 216          | 141      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.55 KB   |
| 397 |      | TRIANGLES | 1              | 180          | 116      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.94 KB   |
| 398 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 399 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 400 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 401 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 402 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 403 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 404 |      | TRIANGLES | 1              | 32           | 52       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.02 KB   |
| 405 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 406 |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 407 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 408 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 409 |      | TRIANGLES | 1              | 216          | 141      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.55 KB   |
| 410 |      | TRIANGLES | 1              | 180          | 116      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.94 KB   |
| 411 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 412 |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 413 |      | TRIANGLES | 6              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 316 Bytes |
| 414 |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 415 |      | TRIANGLES | 6              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 316 Bytes |
| 416 |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 417 |      | TRIANGLES | 6              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 316 Bytes |
| 418 |      | TRIANGLES | 1              | 40           | 64       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.26 KB   |
| 419 |      | TRIANGLES | 6              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 316 Bytes |
| 420 |      | TRIANGLES | 6              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 316 Bytes |
| 421 |      | TRIANGLES | 6              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 316 Bytes |
| 422 |      | TRIANGLES | 6              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 316 Bytes |
| 423 |      | TRIANGLES | 6              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 316 Bytes |
| 424 |      | TRIANGLES | 6              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 316 Bytes |
| 425 |      | TRIANGLES | 6              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 316 Bytes |
| 426 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 427 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 428 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 429 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 430 |      | TRIANGLES | 1              | 2            | 4        | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 76 Bytes  |
| 431 |      | TRIANGLES | 1              | 2            | 4        | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 76 Bytes  |
| 432 |      | TRIANGLES | 1              | 2            | 4        | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 76 Bytes  |
| 433 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 434 |      | TRIANGLES | 1              | 80           | 55       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.36 KB   |
| 435 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 436 |      | TRIANGLES | 1              | 80           | 55       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.36 KB   |
| 437 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 438 |      | TRIANGLES | 1              | 80           | 55       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.36 KB   |
| 439 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 440 |      | TRIANGLES | 1              | 80           | 55       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.36 KB   |
| 441 |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 442 |      | TRIANGLES | 1              | 80           | 55       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.36 KB   |
| 443 |      | TRIANGLES | 1              | 17,154       | 34,308   | u16     | COLOR_0:u8_norm, NORMAL:i16_norm, POSITION:i16_norm     | 1         | 617.54 KB |

⁴ size estimates GPU memory required by a mesh, in isolation. If accessors are
  shared by other mesh primitives, but the meshes themselves are not reused, then
  the sum of all mesh sizes will overestimate the asset's total size. See "dedup".



 MATERIALS
 ────────────────────────────────────────────
| #   | name                | instances | textures                          | alphaMode | doubleSided |
| --- | ---                 | ---       | ---                               | ---       | ---         |
| 0   | Field               | 1         | baseColorTexture                  | OPAQUE    |             |
| 1   | Clay                | 3         |                                   | OPAQUE    |             |
| 2   | Base                | 5         |                                   | OPAQUE    |             |
| 3   | OutfieldWallPadding | 1         | baseColorTexture                  | OPAQUE    | ✓           |
| 4   | FoulPoleYellow      | 4         |                                   | OPAQUE    |             |
| 5   |                     | 1         | baseColorTexture                  | BLEND     |             |
| 6   |                     | 2         | baseColorTexture                  | BLEND     |             |
| 7   |                     | 2         | baseColorTexture                  | BLEND     |             |
| 8   | Concrete            | 4         |                                   | OPAQUE    | ✓           |
| 9   | BackstopPadding     | 2         |                                   | OPAQUE    | ✓           |
| 10  | RibbonBoard         | 2         | baseColorTexture, emissiveTexture | OPAQUE    | ✓           |
| 11  |                     | 1         |                                   | OPAQUE    |             |
| 12  | Glass               | 2         |                                   | BLEND     | ✓           |
| 13  | Railing             | 81        |                                   | OPAQUE    | ✓           |
| 14  | RibbonBoard         | 4         | baseColorTexture, emissiveTexture | OPAQUE    | ✓           |
| 15  | SuiteWindows        | 1         | baseColorTexture, emissiveTexture | OPAQUE    | ✓           |
| 16  | ConcreteFascia      | 2         |                                   | OPAQUE    | ✓           |
| 17  | Roof                | 1         |                                   | OPAQUE    | ✓           |
| 18  | FacadeArches        | 3         | baseColorTexture, emissiveTexture | OPAQUE    | ✓           |
| 19  | ParkName            | 1         | baseColorTexture, emissiveTexture | OPAQUE    | ✓           |
| 20  | BackstopNet         | 1         | baseColorTexture                  | BLEND     | ✓           |
| 21  | Dugout              | 2         |                                   | OPAQUE    |             |
| 22  | DugoutRoof          | 2         |                                   | OPAQUE    |             |
| 23  |                     | 2         |                                   | OPAQUE    |             |
| 24  | Pants               | 32        |                                   | OPAQUE    |             |
| 25  | Cap                 | 100       |                                   | OPAQUE    |             |
| 26  |                     | 56        |                                   | OPAQUE    |             |
| 27  | Uniform             | 48        |                                   | OPAQUE    |             |
| 28  |                     | 28        |                                   | OPAQUE    |             |
| 29  | Pants               | 18        |                                   | OPAQUE    |             |
| 30  | Uniform             | 27        |                                   | OPAQUE    |             |
| 31  | Pants               | 2         |                                   | OPAQUE    |             |
| 32  | Cap                 | 4         |                                   | OPAQUE    |             |
| 33  | Uniform             | 3         |                                   | OPAQUE    |             |
| 34  | Pants               | 4         |                                   | OPAQUE    |             |
| 35  | Cap                 | 8         |                                   | OPAQUE    |             |
| 36  | Uniform             | 6         |                                   | OPAQUE    |             |
| 37  | Bat                 | 1         |                                   | OPAQUE    |             |
| 38  | TowerSteel          | 4         |                                   | OPAQUE    |             |
| 39  | LightBank           | 10        | baseColorTexture, emissiveTexture | OPAQUE    |             |
| 40  | BoardFrame          | 4         |                                   | OPAQUE    |             |
| 41  | VideoBoard          | 1         | baseColorTexture, emissiveTexture | OPAQUE    |             |
| 42  | LineScore           | 1         | baseColorTexture, emissiveTexture | OPAQUE    |             |
| 43  | ParkNameTop         | 1         | baseColorTexture, emissiveTexture | OPAQUE    |             |
| 44  | Flag                | 2         |                                   | OPAQUE    | ✓           |
| 45  | Flag                | 2         |                                   | OPAQUE    | ✓           |
| 46  | Flag                | 1         |                                   | OPAQUE    | ✓           |
| 47  | CrowdLite           | 1         |                                   | OPAQUE    | ✓           |



 TEXTURES
 ────────────────────────────────────────────
| #   | name | uri | slots                             | instances | mimeType  | compression | resolution | size      | gpuSize⁵  |
| --- | ---  | --- | ---                               | ---       | ---       | ---         | ---        | ---       | ---       |
| 0   |      |     | baseColorTexture                  | 1         | image/png |             | 512x512    | 53.14 KB  | 1.4 MB    |
| 1   |      |     | baseColorTexture                  | 1         | image/png |             | 512x96     | 6.75 KB   | 262.14 KB |
| 2   |      |     | baseColorTexture                  | 1         | image/png |             | 128x64     | 2 KB      | 43.69 KB  |
| 3   |      |     | baseColorTexture                  | 1         | image/png |             | 128x64     | 2.52 KB   | 43.69 KB  |
| 4   |      |     |                                   | 0         | image/png |             | 128x64     | 2.52 KB   | 43.69 KB  |
| 5   |      |     | baseColorTexture                  | 1         | image/png |             | 128x64     | 3.07 KB   | 43.69 KB  |
| 6   |      |     |                                   | 0         | image/png |             | 128x64     | 3.07 KB   | 43.69 KB  |
| 7   |      |     | baseColorTexture, emissiveTexture | 1         | image/png |             | 512x64     | 15.8 KB   | 174.78 KB |
| 8   |      |     | baseColorTexture, emissiveTexture | 1         | image/png |             | 512x64     | 15.1 KB   | 174.78 KB |
| 9   |      |     | baseColorTexture, emissiveTexture | 1         | image/png |             | 256x64     | 892 Bytes | 87.39 KB  |
| 10  |      |     | baseColorTexture                  | 1         | image/png |             | 256x256    | 6.44 KB   | 349.52 KB |
| 11  |      |     | emissiveTexture                   | 1         | image/png |             | 256x256    | 3.39 KB   | 349.52 KB |
| 12  |      |     | baseColorTexture, emissiveTexture | 1         | image/png |             | 512x128    | 15.52 KB  | 349.53 KB |
| 13  |      |     | baseColorTexture                  | 1         | image/png |             | 64x64      | 364 Bytes | 21.84 KB  |
| 14  |      |     | baseColorTexture, emissiveTexture | 1         | image/png |             | 256x128    | 9.18 KB   | 174.76 KB |
| 15  |      |     | baseColorTexture, emissiveTexture | 1         | image/png |             | 512x512    | 342.35 KB | 1.4 MB    |
| 16  |      |     | baseColorTexture, emissiveTexture | 1         | image/png |             | 512x192    | 15.33 KB  | 524.28 KB |
| 17  |      |     | baseColorTexture, emissiveTexture | 1         | image/png |             | 512x128    | 10.87 KB  | 349.53 KB |

⁵ gpuSize estimates minimum VRAM memory allocation. Older devices may require
  additional memory for GPU compression formats.



 ANIMATIONS
 ────────────────────────────────────────────
No animations found.

