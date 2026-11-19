
 OVERVIEW
 ────────────────────────────────────────────
| key                | value                                                               |
| ---                | ---                                                                 |
| version            | 2.0                                                                 |
| generator          | glTF-Transform v4.5.1                                               |
| extensionsUsed     | EXT_meshopt_compression, KHR_materials_unlit, KHR_mesh_quantization |
| extensionsRequired | EXT_meshopt_compression, KHR_mesh_quantization                      |



 SCENES
 ────────────────────────────────────────────
| #   | name     | rootName         | bboxMin                | bboxMax            | renderVertexCount¹ | uploadVertexCount | uploadNaiveVertexCount |
| --- | ---      | ---              | ---                    | ---                | ---                | ---               | ---                    |
| 0   | AuxScene | OpenWheelCockpit | -1.03, -0.08746, -2.45 | 1.03, 1.2084, 3.18 | 114,888            | 56,060            | 72,360                 |

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
| 0   |      | TRIANGLES | 1              | 572          | 1,716    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 34.32 KB  |
| 1   |      | TRIANGLES | 1              | 2,196        | 6,588    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 131.76 KB |
| 2   |      | TRIANGLES | 1              | 1,600        | 891      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 23.86 KB  |
| 3   |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 4   |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 5   |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 6   |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 7   |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 8   |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 9   |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 10  |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 11  |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 12  |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 13  |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 14  |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 15  |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 16  |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 552 Bytes |
| 17  |      | TRIANGLES | 1              | 1,120        | 609      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 18.9 KB   |
| 18  |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 19  |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 20  |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 21  |      | TRIANGLES | 1              | 80           | 82       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 2.12 KB   |
| 22  |      | TRIANGLES | 1              | 80           | 82       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 2.12 KB   |
| 23  |      | TRIANGLES | 1              | 80           | 82       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 2.12 KB   |
| 24  |      | TRIANGLES | 1              | 80           | 82       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 2.12 KB   |
| 25  |      | TRIANGLES | 1              | 80           | 82       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 2.12 KB   |
| 26  |      | TRIANGLES | 1              | 128          | 196      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.9 KB    |
| 27  |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 28  |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 29  |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 30  |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 31  |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 32  |      | TRIANGLES | 1              | 616          | 1,848    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 36.96 KB  |
| 33  |      | TRIANGLES | 1              | 64           | 100      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.98 KB   |
| 34  |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 35  |      | TRIANGLES | 1              | 554          | 1,662    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 33.24 KB  |
| 36  |      | TRIANGLES | 1              | 64           | 100      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.98 KB   |
| 37  |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 38  |      | TRIANGLES | 1              | 2,688        | 1,455    | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 39.41 KB  |
| 39  |      | TRIANGLES | 1              | 1,120        | 615      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 16.56 KB  |
| 40  |      | TRIANGLES | 1              | 80           | 124      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.46 KB   |
| 41  |      | TRIANGLES | 1              | 80           | 124      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.46 KB   |
| 42  |      | TRIANGLES | 1              | 80           | 124      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.46 KB   |
| 43  |      | TRIANGLES | 1              | 192          | 117      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.02 KB   |
| 44  |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 45  |      | TRIANGLES | 1              | 2            | 4        | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 76 Bytes  |
| 46  |      | TRIANGLES | 1              | 192          | 117      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.02 KB   |
| 47  |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 48  |      | TRIANGLES | 1              | 2            | 4        | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 76 Bytes  |
| 49  |      | TRIANGLES | 1              | 560          | 328      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 8.61 KB   |
| 50  |      | TRIANGLES | 1              | 64           | 66       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.44 KB   |
| 51  |      | TRIANGLES | 1              | 128          | 196      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.9 KB    |
| 52  |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 53  |      | TRIANGLES | 1              | 96           | 63       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.58 KB   |
| 54  |      | TRIANGLES | 1              | 96           | 63       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.58 KB   |
| 55  |      | TRIANGLES | 1              | 96           | 63       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.58 KB   |
| 56  |      | TRIANGLES | 1              | 96           | 63       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.58 KB   |
| 57  |      | TRIANGLES | 1              | 96           | 63       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.58 KB   |
| 58  |      | TRIANGLES | 1              | 96           | 63       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.58 KB   |
| 59  |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 60  |      | TRIANGLES | 1              | 560          | 328      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 8.61 KB   |
| 61  |      | TRIANGLES | 1              | 64           | 66       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.44 KB   |
| 62  |      | TRIANGLES | 1              | 128          | 196      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.9 KB    |
| 63  |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 64  |      | TRIANGLES | 1              | 96           | 63       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.58 KB   |
| 65  |      | TRIANGLES | 1              | 96           | 63       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.58 KB   |
| 66  |      | TRIANGLES | 1              | 96           | 63       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.58 KB   |
| 67  |      | TRIANGLES | 1              | 96           | 63       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.58 KB   |
| 68  |      | TRIANGLES | 1              | 96           | 63       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.58 KB   |
| 69  |      | TRIANGLES | 1              | 96           | 63       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.58 KB   |
| 70  |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 71  |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 72  |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 73  |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 74  |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 75  |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 76  |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 77  |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 78  |      | TRIANGLES | 1              | 360          | 217      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 5.63 KB   |
| 79  |      | TRIANGLES | 1              | 360          | 217      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 5.63 KB   |
| 80  |      | TRIANGLES | 1              | 360          | 217      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 5.63 KB   |
| 81  |      | TRIANGLES | 1              | 360          | 217      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 5.63 KB   |
| 82  |      | TRIANGLES | 1              | 480          | 279      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 7.34 KB   |
| 83  |      | TRIANGLES | 1              | 48           | 76       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.5 KB    |
| 84  |      | TRIANGLES | 1              | 48           | 76       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.5 KB    |
| 85  |      | TRIANGLES | 1              | 48           | 76       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.5 KB    |
| 86  |      | TRIANGLES | 1              | 48           | 76       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.5 KB    |
| 87  |      | TRIANGLES | 1              | 24           | 40       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 784 Bytes |
| 88  |      | TRIANGLES | 1              | 64           | 100      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.98 KB   |
| 89  |      | TRIANGLES | 1              | 64           | 100      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.98 KB   |
| 90  |      | TRIANGLES | 1              | 64           | 100      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.98 KB   |
| 91  |      | TRIANGLES | 1              | 64           | 100      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 1.98 KB   |
| 92  |      | TRIANGLES | 1              | 80           | 124      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.46 KB   |
| 93  |      | TRIANGLES | 1              | 112          | 172      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.42 KB   |
| 94  |      | TRIANGLES | 1              | 560          | 319      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 8.46 KB   |
| 95  |      | TRIANGLES | 1              | 1,244        | 3,732    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 74.64 KB  |
| 96  |      | TRIANGLES | 1              | 768          | 425      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 11.41 KB  |
| 97  |      | TRIANGLES | 1              | 768          | 425      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 11.41 KB  |
| 98  |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 99  |      | TRIANGLES | 1              | 2            | 4        | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 76 Bytes  |
| 100 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 101 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 102 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 103 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 104 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 105 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 106 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 107 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 108 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 109 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 110 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 111 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 112 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 113 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 114 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 115 |      | TRIANGLES | 1              | 80           | 124      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.46 KB   |
| 116 |      | TRIANGLES | 1              | 240          | 147      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.79 KB   |
| 117 |      | TRIANGLES | 1              | 80           | 124      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.46 KB   |
| 118 |      | TRIANGLES | 1              | 240          | 147      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.79 KB   |
| 119 |      | TRIANGLES | 1              | 80           | 124      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.46 KB   |
| 120 |      | TRIANGLES | 1              | 240          | 147      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.79 KB   |
| 121 |      | TRIANGLES | 1              | 80           | 124      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.46 KB   |
| 122 |      | TRIANGLES | 1              | 240          | 147      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.79 KB   |
| 123 |      | TRIANGLES | 1              | 80           | 124      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.46 KB   |
| 124 |      | TRIANGLES | 1              | 240          | 147      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.79 KB   |
| 125 |      | TRIANGLES | 1              | 80           | 124      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.46 KB   |
| 126 |      | TRIANGLES | 1              | 240          | 147      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.79 KB   |
| 127 |      | TRIANGLES | 1              | 80           | 124      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.46 KB   |
| 128 |      | TRIANGLES | 1              | 240          | 147      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.79 KB   |
| 129 |      | TRIANGLES | 1              | 80           | 124      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 2.46 KB   |
| 130 |      | TRIANGLES | 1              | 240          | 147      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.79 KB   |
| 131 |      | TRIANGLES | 1              | 96           | 148      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 5         | 2.94 KB   |
| 132 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 133 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 134 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 135 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 136 |      | TRIANGLES | 1              | 12           | 24       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 456 Bytes |
| 137 |      | TRIANGLES | 1              | 116          | 348      |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 6.96 KB   |
| 138 |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 139 |      | TRIANGLES | 1              | 116          | 348      |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 6.96 KB   |
| 140 |      | TRIANGLES | 1              | 444          | 1,332    |         | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32      | 1         | 26.64 KB  |
| 141 |      | TRIANGLES | 1              | 112          | 172      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm | 1         | 3.42 KB   |

⁴ size estimates GPU memory required by a mesh, in isolation. If accessors are
  shared by other mesh primitives, but the meshes themselves are not reused, then
  the sum of all mesh sizes will overestimate the asset's total size. See "dedup".



 MATERIALS
 ────────────────────────────────────────────
| #   | name             | instances | textures                                   | alphaMode | doubleSided |
| --- | ---              | ---       | ---                                        | ---       | ---         |
| 0   | Carbon           | 25        | baseColorTexture, metallicRoughnessTexture | OPAQUE    |             |
| 1   | BodyPaint        | 4         |                                            | OPAQUE    |             |
| 2   | Suede            | 3         | baseColorTexture                           | OPAQUE    |             |
| 3   | CarbonMatte      | 5         | baseColorTexture, metallicRoughnessTexture | OPAQUE    |             |
| 4   | PaddingFoam      | 5         | baseColorTexture                           | OPAQUE    |             |
| 5   | AccentPaint      | 3         |                                            | OPAQUE    |             |
| 6   | HarnessWebbing   | 5         | baseColorTexture                           | OPAQUE    | ✓           |
| 7   | BrushedAluminium | 21        | baseColorTexture                           | OPAQUE    |             |
| 8   | RedAnodised      | 2         |                                            | OPAQUE    |             |
| 9   | BlackAnodised    | 13        |                                            | OPAQUE    |             |
| 10  | Titanium         | 8         |                                            | OPAQUE    |             |
| 11  | MirrorGlass      | 2         |                                            | OPAQUE    |             |
| 12  | Tyre             | 2         |                                            | OPAQUE    |             |
| 13  | WheelRim         | 4         |                                            | OPAQUE    |             |
| 14  | YellowAnodised   | 9         |                                            | OPAQUE    |             |
| 15  | CableSheath      | 1         |                                            | OPAQUE    |             |
| 16  | CableSheath      | 1         |                                            | OPAQUE    |             |
| 17  | CableSheath      | 1         |                                            | OPAQUE    |             |
| 18  | CableSheath      | 1         |                                            | OPAQUE    |             |
| 19  | Rubber           | 3         |                                            | OPAQUE    |             |
| 20  | Display          | 1         | baseColorTexture                           | OPAQUE    |             |
| 21  | LED              | 5         |                                            | OPAQUE    |             |
| 22  | LED              | 5         |                                            | OPAQUE    |             |
| 23  | LED              | 5         |                                            | OPAQUE    |             |
| 24  | ButtonCap        | 1         |                                            | OPAQUE    |             |
| 25  | ButtonCap        | 1         |                                            | OPAQUE    |             |
| 26  | ButtonCap        | 1         |                                            | OPAQUE    |             |
| 27  | ButtonCap        | 1         |                                            | OPAQUE    |             |
| 28  | ButtonCap        | 1         |                                            | OPAQUE    |             |
| 29  | ButtonCap        | 1         |                                            | OPAQUE    |             |
| 30  | ButtonCap        | 2         |                                            | OPAQUE    |             |



 TEXTURES
 ────────────────────────────────────────────
| #   | name | uri | slots                    | instances | mimeType  | compression | resolution | size      | gpuSize⁵  |
| --- | ---  | --- | ---                      | ---       | ---       | ---         | ---        | ---       | ---       |
| 0   |      |     | metallicRoughnessTexture | 2         | image/png |             | 512x512    | 73.74 KB  | 1.4 MB    |
| 1   |      |     | baseColorTexture         | 2         | image/png |             | 512x512    | 143.15 KB | 1.4 MB    |
| 2   |      |     | baseColorTexture         | 1         | image/png |             | 256x256    | 91.9 KB   | 349.52 KB |
| 3   |      |     | baseColorTexture         | 1         | image/png |             | 256x256    | 89.17 KB  | 349.52 KB |
| 4   |      |     | baseColorTexture         | 1         | image/png |             | 64x64      | 308 Bytes | 21.84 KB  |
| 5   |      |     | baseColorTexture         | 1         | image/png |             | 512x64     | 1.19 KB   | 174.78 KB |
| 6   |      |     | baseColorTexture         | 1         | image/png |             | 320x180    | 11.78 KB  | 307.05 KB |

⁵ gpuSize estimates minimum VRAM memory allocation. Older devices may require
  additional memory for GPU compression formats.



 ANIMATIONS
 ────────────────────────────────────────────
No animations found.

