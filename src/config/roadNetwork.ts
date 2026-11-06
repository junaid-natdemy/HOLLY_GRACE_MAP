import {
  RoadEdge,
  RoadGraph,
  RoadNetworkData,
  RoadNode,
} from '../types/campus';

/**
 * VERIFIED CAMPUS ROAD NETWORK (Manual Ground Truth)
 * Exported from HOLLY GRACE Road Network Editor.
 * Includes complete connections for South Entrance, all academic wings,
 * hilltop blocks, Main Stage loop, Position 11 (Zion Block), and Position 12 (Stalls).
 */
export const VERIFIED_MANUAL_ROAD_DATA: RoadNetworkData = {
  "nodes": {
    "node_53skt": {
      "id": "node_53skt",
      "label": "Campus South Entrance Gate",
      "isEntrance": true,
      "pixelCoord": {
        "x": 655.9,
        "y": 718.8
      },
      "normalizedCoord": {
        "x": 0.512421875,
        "y": 0.9286821705426356
      }
    },
    "node_53u2i": {
      "id": "node_53u2i",
      "pixelCoord": {
        "x": 655.9,
        "y": 699.3
      },
      "normalizedCoord": {
        "x": 0.512421875,
        "y": 0.9034883720930232
      }
    },
    "node_53v4x": {
      "id": "node_53v4x",
      "pixelCoord": {
        "x": 655.4,
        "y": 681
      },
      "normalizedCoord": {
        "x": 0.5120312499999999,
        "y": 0.8798449612403101
      }
    },
    "node_53w5y": {
      "id": "node_53w5y",
      "pixelCoord": {
        "x": 655.6,
        "y": 663.5
      },
      "normalizedCoord": {
        "x": 0.5121875,
        "y": 0.8572351421188631
      }
    },
    "node_53xi4": {
      "id": "node_53xi4",
      "pixelCoord": {
        "x": 653.7,
        "y": 643.5
      },
      "normalizedCoord": {
        "x": 0.510703125,
        "y": 0.8313953488372093
      }
    },
    "node_53z32": {
      "id": "node_53z32",
      "pixelCoord": {
        "x": 649.1,
        "y": 626.9
      },
      "normalizedCoord": {
        "x": 0.507109375,
        "y": 0.8099483204134367
      }
    },
    "node_54e7y": {
      "id": "node_54e7y",
      "pixelCoord": {
        "x": 642.6,
        "y": 612.9
      },
      "normalizedCoord": {
        "x": 0.50203125,
        "y": 0.791860465116279
      }
    },
    "node_54fcq": {
      "id": "node_54fcq",
      "pixelCoord": {
        "x": 634.9,
        "y": 595.4
      },
      "normalizedCoord": {
        "x": 0.49601562499999996,
        "y": 0.7692506459948321
      }
    },
    "node_54gbf": {
      "id": "node_54gbf",
      "pixelCoord": {
        "x": 629.4,
        "y": 576.9
      },
      "normalizedCoord": {
        "x": 0.49171875,
        "y": 0.7453488372093023
      }
    },
    "s_spine_1": {
      "id": "s_spine_1",
      "label": "Main Spine Lower",
      "pixelCoord": {
        "x": 624,
        "y": 555
      },
      "normalizedCoord": {
        "x": 0.4875,
        "y": 0.7170542635658915
      }
    },
    "node_56er3": {
      "id": "node_56er3",
      "pixelCoord": {
        "x": 621.4,
        "y": 538.9
      },
      "normalizedCoord": {
        "x": 0.48546875,
        "y": 0.6962532299741602
      }
    },
    "node_56h5q": {
      "id": "node_56h5q",
      "pixelCoord": {
        "x": 623.8,
        "y": 517.9
      },
      "normalizedCoord": {
        "x": 0.48734374999999996,
        "y": 0.6691214470284237
      }
    },
    "node_56iy0": {
      "id": "node_56iy0",
      "pixelCoord": {
        "x": 626.6,
        "y": 495.3
      },
      "normalizedCoord": {
        "x": 0.48953125000000003,
        "y": 0.639922480620155
      }
    },
    "node_g7q6n": {
      "id": "node_g7q6n",
      "pixelCoord": {
        "x": 630,
        "y": 478.5
      },
      "normalizedCoord": {
        "x": 0.4921875,
        "y": 0.6182170542635659
      }
    },
    "node_57d0f": {
      "id": "node_57d0f",
      "pixelCoord": {
        "x": 634.6,
        "y": 461.8
      },
      "normalizedCoord": {
        "x": 0.49578125,
        "y": 0.596640826873385
      }
    },
    "node_57emq": {
      "id": "node_57emq",
      "pixelCoord": {
        "x": 636.3,
        "y": 443.7
      },
      "normalizedCoord": {
        "x": 0.49710937499999996,
        "y": 0.5732558139534883
      }
    },
    "node_57idh": {
      "id": "node_57idh",
      "pixelCoord": {
        "x": 638,
        "y": 426.6
      },
      "normalizedCoord": {
        "x": 0.4984375,
        "y": 0.5511627906976745
      }
    },
    "node_057mf": {
      "id": "node_057mf",
      "pixelCoord": {
        "x": 638,
        "y": 412
      },
      "normalizedCoord": {
        "x": 0.4984375,
        "y": 0.5322997416020672
      }
    },
    "node_59bug": {
      "id": "node_59bug",
      "pixelCoord": {
        "x": 640,
        "y": 395.6
      },
      "normalizedCoord": {
        "x": 0.5,
        "y": 0.5111111111111112
      }
    },
    "node_59dpm": {
      "id": "node_59dpm",
      "pixelCoord": {
        "x": 642.4,
        "y": 376.4
      },
      "normalizedCoord": {
        "x": 0.501875,
        "y": 0.4863049095607235
      }
    },
    "node_59f2m": {
      "id": "node_59f2m",
      "pixelCoord": {
        "x": 645.1,
        "y": 357.6
      },
      "normalizedCoord": {
        "x": 0.503984375,
        "y": 0.462015503875969
      }
    },
    "node_5ai2e": {
      "id": "node_5ai2e",
      "pixelCoord": {
        "x": 651,
        "y": 330
      },
      "normalizedCoord": {
        "x": 0.50859375,
        "y": 0.4263565891472868
      }
    },
    "s_curve_2": {
      "id": "s_curve_2",
      "label": "North Wing Road Approach 2",
      "pixelCoord": {
        "x": 656,
        "y": 303
      },
      "normalizedCoord": {
        "x": 0.5125,
        "y": 0.39147286821705424
      }
    },
    "node_0lgi7": {
      "id": "node_0lgi7",
      "pixelCoord": {
        "x": 660,
        "y": 280
      },
      "normalizedCoord": {
        "x": 0.515625,
        "y": 0.36175710594315247
      }
    },
    "node_0live": {
      "id": "node_0live",
      "pixelCoord": {
        "x": 662,
        "y": 256
      },
      "normalizedCoord": {
        "x": 0.5171875,
        "y": 0.330749354005168
      }
    },
    "node_0ln5z": {
      "id": "node_0ln5z",
      "pixelCoord": {
        "x": 647,
        "y": 240
      },
      "normalizedCoord": {
        "x": 0.50546875,
        "y": 0.31007751937984496
      }
    },
    "node_0nab4": {
      "id": "node_0nab4",
      "pixelCoord": {
        "x": 660.4,
        "y": 221.7
      },
      "normalizedCoord": {
        "x": 0.5159374999999999,
        "y": 0.28643410852713175
      }
    },
    "node_07j9z": {
      "id": "node_07j9z",
      "pixelCoord": {
        "x": 630.3,
        "y": 269.5
      },
      "normalizedCoord": {
        "x": 0.49242187499999995,
        "y": 0.3481912144702842
      }
    },
    "node_54v1j": {
      "id": "node_54v1j",
      "pixelCoord": {
        "x": 601.3,
        "y": 604
      },
      "normalizedCoord": {
        "x": 0.46976562499999996,
        "y": 0.7803617571059431
      }
    },
    "node_47pnv": {
      "id": "node_47pnv",
      "pixelCoord": {
        "x": 581.7,
        "y": 604.8
      },
      "normalizedCoord": {
        "x": 0.454453125,
        "y": 0.7813953488372093
      }
    },
    "node_47rcy": {
      "id": "node_47rcy",
      "pixelCoord": {
        "x": 545.2,
        "y": 604.8
      },
      "normalizedCoord": {
        "x": 0.4259375,
        "y": 0.7813953488372093
      }
    },
    "node_4tpwc": {
      "id": "node_4tpwc",
      "pixelCoord": {
        "x": 514.4,
        "y": 599.7
      },
      "normalizedCoord": {
        "x": 0.401875,
        "y": 0.7748062015503877
      }
    },
    "node_56m5b": {
      "id": "node_56m5b",
      "pixelCoord": {
        "x": 640.1,
        "y": 517
      },
      "normalizedCoord": {
        "x": 0.500078125,
        "y": 0.6679586563307494
      }
    },
    "node_56nai": {
      "id": "node_56nai",
      "pixelCoord": {
        "x": 660.8,
        "y": 517.2
      },
      "normalizedCoord": {
        "x": 0.51625,
        "y": 0.6682170542635659
      }
    },
    "node_56opx": {
      "id": "node_56opx",
      "pixelCoord": {
        "x": 680.8,
        "y": 517
      },
      "normalizedCoord": {
        "x": 0.531875,
        "y": 0.6679586563307494
      }
    },
    "node_56pyc": {
      "id": "node_56pyc",
      "pixelCoord": {
        "x": 699.8,
        "y": 517.4
      },
      "normalizedCoord": {
        "x": 0.5467187499999999,
        "y": 0.6684754521963824
      }
    },
    "node_56r0t": {
      "id": "node_56r0t",
      "pixelCoord": {
        "x": 716.6,
        "y": 517.2
      },
      "normalizedCoord": {
        "x": 0.55984375,
        "y": 0.6682170542635659
      }
    },
    "node_56s0v": {
      "id": "node_56s0v",
      "pixelCoord": {
        "x": 737.8,
        "y": 517.2
      },
      "normalizedCoord": {
        "x": 0.57640625,
        "y": 0.6682170542635659
      }
    },
    "node_57osy": {
      "id": "node_57osy",
      "pixelCoord": {
        "x": 650.9,
        "y": 446.4
      },
      "normalizedCoord": {
        "x": 0.508515625,
        "y": 0.5767441860465116
      }
    },
    "node_57qbp": {
      "id": "node_57qbp",
      "pixelCoord": {
        "x": 670.9,
        "y": 447.3
      },
      "normalizedCoord": {
        "x": 0.524140625,
        "y": 0.577906976744186
      }
    },
    "node_57sda": {
      "id": "node_57sda",
      "pixelCoord": {
        "x": 688.7,
        "y": 447.8
      },
      "normalizedCoord": {
        "x": 0.538046875,
        "y": 0.5785529715762274
      }
    },
    "node_57uwv": {
      "id": "node_57uwv",
      "pixelCoord": {
        "x": 705.8,
        "y": 448
      },
      "normalizedCoord": {
        "x": 0.55140625,
        "y": 0.5788113695090439
      }
    },
    "node_57xzx": {
      "id": "node_57xzx",
      "pixelCoord": {
        "x": 724.1,
        "y": 448
      },
      "normalizedCoord": {
        "x": 0.565703125,
        "y": 0.5788113695090439
      }
    },
    "node_581uh": {
      "id": "node_581uh",
      "pixelCoord": {
        "x": 742.8,
        "y": 449
      },
      "normalizedCoord": {
        "x": 0.5803125,
        "y": 0.5801033591731266
      }
    },
    "node_5aejw": {
      "id": "node_5aejw",
      "pixelCoord": {
        "x": 682,
        "y": 329.5
      },
      "normalizedCoord": {
        "x": 0.5328125,
        "y": 0.4257105943152455
      }
    },
    "node_5ad1s": {
      "id": "node_5ad1s",
      "pixelCoord": {
        "x": 702.5,
        "y": 329.8
      },
      "normalizedCoord": {
        "x": 0.548828125,
        "y": 0.4260981912144703
      }
    },
    "node_5abgq": {
      "id": "node_5abgq",
      "pixelCoord": {
        "x": 720.5,
        "y": 331.2
      },
      "normalizedCoord": {
        "x": 0.562890625,
        "y": 0.42790697674418604
      }
    },
    "node_5aala": {
      "id": "node_5aala",
      "pixelCoord": {
        "x": 742.1,
        "y": 331.2
      },
      "normalizedCoord": {
        "x": 0.5797656250000001,
        "y": 0.42790697674418604
      }
    },
    "node_5a9nh": {
      "id": "node_5a9nh",
      "pixelCoord": {
        "x": 762.3,
        "y": 331.9
      },
      "normalizedCoord": {
        "x": 0.5955468749999999,
        "y": 0.4288113695090439
      }
    },
    "node_5a8ic": {
      "id": "node_5a8ic",
      "pixelCoord": {
        "x": 783.5,
        "y": 332.6
      },
      "normalizedCoord": {
        "x": 0.612109375,
        "y": 0.42971576227390185
      }
    },
    "node_5a7ff": {
      "id": "node_5a7ff",
      "pixelCoord": {
        "x": 805.8,
        "y": 332.3
      },
      "normalizedCoord": {
        "x": 0.62953125,
        "y": 0.429328165374677
      }
    },
    "node_5a5tn": {
      "id": "node_5a5tn",
      "pixelCoord": {
        "x": 828.5,
        "y": 333
      },
      "normalizedCoord": {
        "x": 0.647265625,
        "y": 0.43023255813953487
      }
    },
    "node_5obxd": {
      "id": "node_5obxd",
      "pixelCoord": {
        "x": 845.7,
        "y": 330.8
      },
      "normalizedCoord": {
        "x": 0.6607031250000001,
        "y": 0.42739018087855296
      }
    },
    "r_hill_3": {
      "id": "r_hill_3",
      "label": "Hill Road Curve 3",
      "pixelCoord": {
        "x": 631,
        "y": 236
      },
      "normalizedCoord": {
        "x": 0.49296875,
        "y": 0.3049095607235142
      }
    },
    "r_hill_4": {
      "id": "r_hill_4",
      "label": "Hill Road Mid",
      "pixelCoord": {
        "x": 599,
        "y": 227
      },
      "normalizedCoord": {
        "x": 0.46796875,
        "y": 0.29328165374677
      }
    },
    "r_hill_5": {
      "id": "r_hill_5",
      "label": "Hill Road Curve 5",
      "pixelCoord": {
        "x": 565,
        "y": 218
      },
      "normalizedCoord": {
        "x": 0.44140625,
        "y": 0.28165374677002586
      }
    },
    "r_hill_6": {
      "id": "r_hill_6",
      "label": "Hill Road West 1",
      "pixelCoord": {
        "x": 534,
        "y": 215
      },
      "normalizedCoord": {
        "x": 0.4171875,
        "y": 0.2777777777777778
      }
    },
    "r_hill_7": {
      "id": "r_hill_7",
      "label": "Hill Road West 2",
      "pixelCoord": {
        "x": 504,
        "y": 209
      },
      "normalizedCoord": {
        "x": 0.39375,
        "y": 0.27002583979328165
      }
    },
    "r_hill_8": {
      "id": "r_hill_8",
      "label": "Hill Road West 3",
      "pixelCoord": {
        "x": 474,
        "y": 202
      },
      "normalizedCoord": {
        "x": 0.3703125,
        "y": 0.26098191214470284
      }
    },
    "node_0o5bb": {
      "id": "node_0o5bb",
      "pixelCoord": {
        "x": 452.1,
        "y": 193.9
      },
      "normalizedCoord": {
        "x": 0.353203125,
        "y": 0.2505167958656331
      }
    },
    "node_0scx7": {
      "id": "node_0scx7",
      "pixelCoord": {
        "x": 433.4,
        "y": 183.7
      },
      "normalizedCoord": {
        "x": 0.33859374999999997,
        "y": 0.23733850129198966
      }
    },
    "node_0sbip": {
      "id": "node_0sbip",
      "pixelCoord": {
        "x": 416,
        "y": 170
      },
      "normalizedCoord": {
        "x": 0.325,
        "y": 0.21963824289405684
      }
    },
    "node_0qpk6": {
      "id": "node_0qpk6",
      "pixelCoord": {
        "x": 370.2,
        "y": 173.5
      },
      "normalizedCoord": {
        "x": 0.28921874999999997,
        "y": 0.22416020671834624
      }
    },
    "node_0s9xa": {
      "id": "node_0s9xa",
      "pixelCoord": {
        "x": 409.5,
        "y": 144
      },
      "normalizedCoord": {
        "x": 0.319921875,
        "y": 0.18604651162790697
      }
    },
    "node_0s1hl": {
      "id": "node_0s1hl",
      "pixelCoord": {
        "x": 417.7,
        "y": 124.2
      },
      "normalizedCoord": {
        "x": 0.32632812499999997,
        "y": 0.16046511627906976
      }
    },
    "node_0tguj": {
      "id": "node_0tguj",
      "pixelCoord": {
        "x": 449.5,
        "y": 111.5
      },
      "normalizedCoord": {
        "x": 0.351171875,
        "y": 0.14405684754521964
      }
    },
    "node_7135m": {
      "id": "node_7135m",
      "pixelCoord": {
        "x": 871.8,
        "y": 331.9
      },
      "normalizedCoord": {
        "x": 0.6810937499999999,
        "y": 0.4288113695090439
      }
    },
    "node_715it": {
      "id": "node_715it",
      "pixelCoord": {
        "x": 913.4,
        "y": 326.3
      },
      "normalizedCoord": {
        "x": 0.71359375,
        "y": 0.4215762273901809
      }
    },
    "node_8ehpm": {
      "id": "node_8ehpm",
      "pixelCoord": {
        "x": 1005.4,
        "y": 313.5
      },
      "normalizedCoord": {
        "x": 0.7854687499999999,
        "y": 0.4050387596899225
      }
    },
    "node_8en2o": {
      "id": "node_8en2o",
      "pixelCoord": {
        "x": 1023.3,
        "y": 313.8
      },
      "normalizedCoord": {
        "x": 0.799453125,
        "y": 0.4054263565891473
      }
    },
    "node_8eodf": {
      "id": "node_8eodf",
      "pixelCoord": {
        "x": 1045.2,
        "y": 312.4
      },
      "normalizedCoord": {
        "x": 0.8165625000000001,
        "y": 0.40361757105943147
      }
    },
    "node_8epv5": {
      "id": "node_8epv5",
      "pixelCoord": {
        "x": 1068.6,
        "y": 310.5
      },
      "normalizedCoord": {
        "x": 0.8348437499999999,
        "y": 0.4011627906976744
      }
    },
    "node_8erym": {
      "id": "node_8erym",
      "pixelCoord": {
        "x": 1072.6,
        "y": 295.9
      },
      "normalizedCoord": {
        "x": 0.8379687499999999,
        "y": 0.38229974160206714
      }
    },
    "node_8etil": {
      "id": "node_8etil",
      "pixelCoord": {
        "x": 1068.9,
        "y": 280.6
      },
      "normalizedCoord": {
        "x": 0.8350781250000001,
        "y": 0.3625322997416021
      }
    },
    "node_8ex1y": {
      "id": "node_8ex1y",
      "pixelCoord": {
        "x": 1058.3,
        "y": 268.2
      },
      "normalizedCoord": {
        "x": 0.826796875,
        "y": 0.3465116279069767
      }
    },
    "node_8ezg1": {
      "id": "node_8ezg1",
      "pixelCoord": {
        "x": 1048.1,
        "y": 255.8
      },
      "normalizedCoord": {
        "x": 0.8188281249999999,
        "y": 0.33049095607235146
      }
    },
    "node_8f0n4": {
      "id": "node_8f0n4",
      "pixelCoord": {
        "x": 1033.9,
        "y": 243.7
      },
      "normalizedCoord": {
        "x": 0.8077343750000001,
        "y": 0.3148578811369509
      }
    },
    "node_8f31o": {
      "id": "node_8f31o",
      "pixelCoord": {
        "x": 1017.4,
        "y": 236
      },
      "normalizedCoord": {
        "x": 0.79484375,
        "y": 0.3049095607235142
      }
    },
    "node_8f4a4": {
      "id": "node_8f4a4",
      "pixelCoord": {
        "x": 1001.7,
        "y": 230.9
      },
      "normalizedCoord": {
        "x": 0.782578125,
        "y": 0.2983204134366925
      }
    },
    "node_8f5i3": {
      "id": "node_8f5i3",
      "pixelCoord": {
        "x": 984.5,
        "y": 225.1
      },
      "normalizedCoord": {
        "x": 0.769140625,
        "y": 0.2908268733850129
      }
    },
    "node_8f6su": {
      "id": "node_8f6su",
      "pixelCoord": {
        "x": 968.8,
        "y": 221
      },
      "normalizedCoord": {
        "x": 0.756875,
        "y": 0.28552971576227393
      }
    },
    "node_8f90y": {
      "id": "node_8f90y",
      "pixelCoord": {
        "x": 950.9,
        "y": 216.7
      },
      "normalizedCoord": {
        "x": 0.742890625,
        "y": 0.27997416020671834
      }
    },
    "node_9u01d": {
      "id": "node_9u01d",
      "pixelCoord": {
        "x": 986.1,
        "y": 313.7
      },
      "normalizedCoord": {
        "x": 0.770390625,
        "y": 0.405297157622739
      }
    },
    "node_9u1ji": {
      "id": "node_9u1ji",
      "pixelCoord": {
        "x": 967.6,
        "y": 315.4
      },
      "normalizedCoord": {
        "x": 0.7559375,
        "y": 0.40749354005167954
      }
    },
    "node_9u2oq": {
      "id": "node_9u2oq",
      "pixelCoord": {
        "x": 949,
        "y": 317.1
      },
      "normalizedCoord": {
        "x": 0.74140625,
        "y": 0.4096899224806202
      }
    },
    "node_9u6e1": {
      "id": "node_9u6e1",
      "pixelCoord": {
        "x": 928.1,
        "y": 320.7
      },
      "normalizedCoord": {
        "x": 0.725078125,
        "y": 0.4143410852713178
      }
    },
    "node_me0ny": {
      "id": "node_me0ny",
      "pixelCoord": {
        "x": 938.5,
        "y": 342
      },
      "normalizedCoord": {
        "x": 0.733203125,
        "y": 0.4418604651162791
      }
    },
    "node_me29c": {
      "id": "node_me29c",
      "pixelCoord": {
        "x": 940.9,
        "y": 373
      },
      "normalizedCoord": {
        "x": 0.735078125,
        "y": 0.4819121447028424
      }
    },
    "node_me5rs": {
      "id": "node_me5rs",
      "pixelCoord": {
        "x": 978.2,
        "y": 374.9
      },
      "normalizedCoord": {
        "x": 0.7642187500000001,
        "y": 0.48436692506459944
      }
    },
    "node_me6tl": {
      "id": "node_me6tl",
      "pixelCoord": {
        "x": 1015.8,
        "y": 373.5
      },
      "normalizedCoord": {
        "x": 0.79359375,
        "y": 0.48255813953488375
      }
    },
    "node_me9y4": {
      "id": "node_me9y4",
      "pixelCoord": {
        "x": 1053.6,
        "y": 375.9
      },
      "normalizedCoord": {
        "x": 0.8231249999999999,
        "y": 0.48565891472868217
      }
    },
    "node_mec1s": {
      "id": "node_mec1s",
      "pixelCoord": {
        "x": 1063.3,
        "y": 398.1
      },
      "normalizedCoord": {
        "x": 0.830703125,
        "y": 0.5143410852713178
      }
    },
    "node_meond": {
      "id": "node_meond",
      "pixelCoord": {
        "x": 940.2,
        "y": 512
      },
      "normalizedCoord": {
        "x": 0.7345312500000001,
        "y": 0.661498708010336
      }
    },
    "node_mesql": {
      "id": "node_mesql",
      "pixelCoord": {
        "x": 934.9,
        "y": 489.3
      },
      "normalizedCoord": {
        "x": 0.730390625,
        "y": 0.632170542635659
      }
    },
    "node_mew1m": {
      "id": "node_mew1m",
      "pixelCoord": {
        "x": 929.6,
        "y": 464.7
      },
      "normalizedCoord": {
        "x": 0.7262500000000001,
        "y": 0.6003875968992248
      }
    },
    "node_mex4d": {
      "id": "node_mex4d",
      "pixelCoord": {
        "x": 923.8,
        "y": 436.2
      },
      "normalizedCoord": {
        "x": 0.72171875,
        "y": 0.5635658914728682
      }
    },
    "node_mexzw": {
      "id": "node_mexzw",
      "pixelCoord": {
        "x": 917.1,
        "y": 415
      },
      "normalizedCoord": {
        "x": 0.7164843750000001,
        "y": 0.5361757105943152
      }
    },
    "node_mezdy": {
      "id": "node_mezdy",
      "pixelCoord": {
        "x": 909.8,
        "y": 395.2
      },
      "normalizedCoord": {
        "x": 0.7107812499999999,
        "y": 0.510594315245478
      }
    },
    "node_mf4o7": {
      "id": "node_mf4o7",
      "pixelCoord": {
        "x": 878.4,
        "y": 396.2
      },
      "normalizedCoord": {
        "x": 0.68625,
        "y": 0.5118863049095607
      }
    },
    "node_mf5j6": {
      "id": "node_mf5j6",
      "pixelCoord": {
        "x": 850.4,
        "y": 396.6
      },
      "normalizedCoord": {
        "x": 0.6643749999999999,
        "y": 0.5124031007751938
      }
    },
    "node_mf6dp": {
      "id": "node_mf6dp",
      "pixelCoord": {
        "x": 822.5,
        "y": 397.6
      },
      "normalizedCoord": {
        "x": 0.642578125,
        "y": 0.5136950904392765
      }
    },
    "node_mf7if": {
      "id": "node_mf7if",
      "pixelCoord": {
        "x": 794.5,
        "y": 401
      },
      "normalizedCoord": {
        "x": 0.620703125,
        "y": 0.5180878552971576
      }
    },
    "node_mf99v": {
      "id": "node_mf99v",
      "pixelCoord": {
        "x": 798.3,
        "y": 426.1
      },
      "normalizedCoord": {
        "x": 0.623671875,
        "y": 0.5505167958656331
      }
    },
    "node_mfavr": {
      "id": "node_mfavr",
      "pixelCoord": {
        "x": 798.8,
        "y": 450.7
      },
      "normalizedCoord": {
        "x": 0.6240625,
        "y": 0.5822997416020672
      }
    },
    "node_mfcdl": {
      "id": "node_mfcdl",
      "pixelCoord": {
        "x": 768.4,
        "y": 450.7
      },
      "normalizedCoord": {
        "x": 0.6003125,
        "y": 0.5822997416020672
      }
    },
    "node_msu38": {
      "id": "node_msu38",
      "pixelCoord": {
        "x": 900,
        "y": 292
      },
      "normalizedCoord": {
        "x": 0.703125,
        "y": 0.3772609819121447
      }
    },
    "node_msv2n": {
      "id": "node_msv2n",
      "pixelCoord": {
        "x": 886,
        "y": 311
      },
      "normalizedCoord": {
        "x": 0.6921875,
        "y": 0.4018087855297158
      }
    },
    "node_mtjds": {
      "id": "node_mtjds",
      "pixelCoord": {
        "x": 875.6,
        "y": 228.6
      },
      "normalizedCoord": {
        "x": 0.6840625,
        "y": 0.29534883720930233
      }
    },
    "node_mtkhi": {
      "id": "node_mtkhi",
      "pixelCoord": {
        "x": 914.9,
        "y": 213.7
      },
      "normalizedCoord": {
        "x": 0.714765625,
        "y": 0.27609819121447027
      }
    },
    "node_mwuxo": {
      "id": "node_mwuxo",
      "pixelCoord": {
        "x": 758,
        "y": 302
      },
      "normalizedCoord": {
        "x": 0.5921875,
        "y": 0.39018087855297157
      }
    }
  },
  "edges": [
    {
      "from": "node_53skt",
      "to": "node_53u2i",
      "distancePx": 19.5
    },
    {
      "from": "node_53u2i",
      "to": "node_53v4x",
      "distancePx": 18.3
    },
    {
      "from": "node_53v4x",
      "to": "node_53w5y",
      "distancePx": 17.5
    },
    {
      "from": "node_53w5y",
      "to": "node_53xi4",
      "distancePx": 20.1
    },
    {
      "from": "node_53xi4",
      "to": "node_53z32",
      "distancePx": 17.2
    },
    {
      "from": "node_54e7y",
      "to": "node_53z32",
      "distancePx": 15.4
    },
    {
      "from": "node_54e7y",
      "to": "node_54fcq",
      "distancePx": 19.1
    },
    {
      "from": "node_54fcq",
      "to": "node_54gbf",
      "distancePx": 19.3
    },
    {
      "from": "node_54gbf",
      "to": "s_spine_1",
      "distancePx": 22.6
    },
    {
      "from": "node_56er3",
      "to": "s_spine_1",
      "distancePx": 16.3
    },
    {
      "from": "node_56er3",
      "to": "node_56h5q",
      "distancePx": 21.1
    },
    {
      "from": "node_56h5q",
      "to": "node_56iy0",
      "distancePx": 22.8
    },
    {
      "from": "node_g7q6n",
      "to": "node_56iy0",
      "distancePx": 17.1
    },
    {
      "from": "node_57d0f",
      "to": "node_g7q6n",
      "distancePx": 17.3
    },
    {
      "from": "node_57d0f",
      "to": "node_57emq",
      "distancePx": 18.2
    },
    {
      "from": "node_57emq",
      "to": "node_57idh",
      "distancePx": 17.2
    },
    {
      "from": "node_57idh",
      "to": "node_057mf",
      "distancePx": 14.6
    },
    {
      "from": "node_057mf",
      "to": "node_59bug",
      "distancePx": 16.5
    },
    {
      "from": "node_57idh",
      "to": "node_59bug",
      "distancePx": 31.1
    },
    {
      "from": "node_59bug",
      "to": "node_59dpm",
      "distancePx": 19.3
    },
    {
      "from": "node_59dpm",
      "to": "node_59f2m",
      "distancePx": 19
    },
    {
      "from": "node_59f2m",
      "to": "node_5ai2e",
      "distancePx": 28.2
    },
    {
      "from": "s_curve_2",
      "to": "node_5ai2e",
      "distancePx": 27.5
    },
    {
      "from": "s_curve_2",
      "to": "node_0lgi7",
      "distancePx": 23.3
    },
    {
      "from": "node_0lgi7",
      "to": "node_0live",
      "distancePx": 24.1
    },
    {
      "from": "node_0live",
      "to": "node_0ln5z",
      "distancePx": 21.9
    },
    {
      "from": "node_0ln5z",
      "to": "r_hill_3",
      "distancePx": 16.5
    },
    {
      "from": "node_0ln5z",
      "to": "node_0nab4",
      "distancePx": 22.7
    },
    {
      "from": "node_0lgi7",
      "to": "node_07j9z",
      "distancePx": 31.5
    },
    {
      "from": "node_54v1j",
      "to": "node_54fcq",
      "distancePx": 34.7
    },
    {
      "from": "node_47pnv",
      "to": "node_54v1j",
      "distancePx": 19.6
    },
    {
      "from": "node_47pnv",
      "to": "node_47rcy",
      "distancePx": 36.5
    },
    {
      "from": "node_47rcy",
      "to": "node_4tpwc",
      "distancePx": 31.2
    },
    {
      "from": "node_56h5q",
      "to": "node_56m5b",
      "distancePx": 16.3
    },
    {
      "from": "node_56m5b",
      "to": "node_56nai",
      "distancePx": 20.7
    },
    {
      "from": "node_56nai",
      "to": "node_56opx",
      "distancePx": 20
    },
    {
      "from": "node_56opx",
      "to": "node_56pyc",
      "distancePx": 19
    },
    {
      "from": "node_56pyc",
      "to": "node_56r0t",
      "distancePx": 16.8
    },
    {
      "from": "node_56r0t",
      "to": "node_56s0v",
      "distancePx": 21.2
    },
    {
      "from": "node_57osy",
      "to": "node_57emq",
      "distancePx": 14.8
    },
    {
      "from": "node_57osy",
      "to": "node_57qbp",
      "distancePx": 20
    },
    {
      "from": "node_57qbp",
      "to": "node_57sda",
      "distancePx": 17.8
    },
    {
      "from": "node_57sda",
      "to": "node_57uwv",
      "distancePx": 17.1
    },
    {
      "from": "node_57uwv",
      "to": "node_57xzx",
      "distancePx": 18.3
    },
    {
      "from": "node_57xzx",
      "to": "node_581uh",
      "distancePx": 18.7
    },
    {
      "from": "node_5aejw",
      "to": "node_5ai2e",
      "distancePx": 31
    },
    {
      "from": "node_5ad1s",
      "to": "node_5aejw",
      "distancePx": 20.5
    },
    {
      "from": "node_5abgq",
      "to": "node_5ad1s",
      "distancePx": 18.1
    },
    {
      "from": "node_5aala",
      "to": "node_5abgq",
      "distancePx": 21.6
    },
    {
      "from": "node_5a9nh",
      "to": "node_5aala",
      "distancePx": 20.2
    },
    {
      "from": "node_5a8ic",
      "to": "node_5a9nh",
      "distancePx": 21.2
    },
    {
      "from": "node_5a7ff",
      "to": "node_5a8ic",
      "distancePx": 22.3
    },
    {
      "from": "node_5a5tn",
      "to": "node_5a7ff",
      "distancePx": 22.7
    },
    {
      "from": "node_5a5tn",
      "to": "node_5obxd",
      "distancePx": 17.3
    },
    {
      "from": "r_hill_3",
      "to": "r_hill_4",
      "distancePx": 33.2
    },
    {
      "from": "r_hill_4",
      "to": "r_hill_5",
      "distancePx": 35.2
    },
    {
      "from": "r_hill_5",
      "to": "r_hill_6",
      "distancePx": 31.1
    },
    {
      "from": "r_hill_6",
      "to": "r_hill_7",
      "distancePx": 30.6
    },
    {
      "from": "r_hill_7",
      "to": "r_hill_8",
      "distancePx": 30.8
    },
    {
      "from": "r_hill_8",
      "to": "node_0o5bb",
      "distancePx": 23.3
    },
    {
      "from": "node_0o5bb",
      "to": "node_0scx7",
      "distancePx": 21.3
    },
    {
      "from": "node_0sbip",
      "to": "node_0scx7",
      "distancePx": 22.1
    },
    {
      "from": "node_0qpk6",
      "to": "node_0sbip",
      "distancePx": 45.9
    },
    {
      "from": "node_0s9xa",
      "to": "node_0sbip",
      "distancePx": 26.8
    },
    {
      "from": "node_0s1hl",
      "to": "node_0s9xa",
      "distancePx": 21.4
    },
    {
      "from": "node_0s1hl",
      "to": "node_0tguj",
      "distancePx": 34.2
    },
    {
      "from": "node_7135m",
      "to": "node_715it",
      "distancePx": 42
    },
    {
      "from": "node_5obxd",
      "to": "node_7135m",
      "distancePx": 26.1
    },
    {
      "from": "node_8ehpm",
      "to": "node_8en2o",
      "distancePx": 17.9
    },
    {
      "from": "node_8en2o",
      "to": "node_8eodf",
      "distancePx": 21.9
    },
    {
      "from": "node_8eodf",
      "to": "node_8epv5",
      "distancePx": 23.5
    },
    {
      "from": "node_8epv5",
      "to": "node_8erym",
      "distancePx": 15.1
    },
    {
      "from": "node_8erym",
      "to": "node_8etil",
      "distancePx": 15.7
    },
    {
      "from": "node_8etil",
      "to": "node_8ex1y",
      "distancePx": 16.3
    },
    {
      "from": "node_8ex1y",
      "to": "node_8ezg1",
      "distancePx": 16.1
    },
    {
      "from": "node_8ezg1",
      "to": "node_8f0n4",
      "distancePx": 18.7
    },
    {
      "from": "node_8f0n4",
      "to": "node_8f31o",
      "distancePx": 18.2
    },
    {
      "from": "node_8f31o",
      "to": "node_8f4a4",
      "distancePx": 16.5
    },
    {
      "from": "node_8f4a4",
      "to": "node_8f5i3",
      "distancePx": 18.2
    },
    {
      "from": "node_8f5i3",
      "to": "node_8f6su",
      "distancePx": 16.2
    },
    {
      "from": "node_8f6su",
      "to": "node_8f90y",
      "distancePx": 18.4
    },
    {
      "from": "node_9u01d",
      "to": "node_9u1ji",
      "distancePx": 18.6
    },
    {
      "from": "node_9u1ji",
      "to": "node_9u2oq",
      "distancePx": 18.7
    },
    {
      "from": "node_9u2oq",
      "to": "node_9u6e1",
      "distancePx": 21.2
    },
    {
      "from": "node_715it",
      "to": "node_9u6e1",
      "distancePx": 15.7
    },
    {
      "from": "node_9u01d",
      "to": "node_8ehpm",
      "distancePx": 19.3
    },
    {
      "from": "node_me0ny",
      "to": "node_me29c",
      "distancePx": 31
    },
    {
      "from": "node_me29c",
      "to": "node_me5rs",
      "distancePx": 37
    },
    {
      "from": "node_me5rs",
      "to": "node_me6tl",
      "distancePx": 38
    },
    {
      "from": "node_me6tl",
      "to": "node_me9y4",
      "distancePx": 38
    },
    {
      "from": "node_me9y4",
      "to": "node_mec1s",
      "distancePx": 24
    },
    {
      "from": "node_meond",
      "to": "node_mesql",
      "distancePx": 23
    },
    {
      "from": "node_mesql",
      "to": "node_mew1m",
      "distancePx": 25
    },
    {
      "from": "node_mew1m",
      "to": "node_mex4d",
      "distancePx": 29
    },
    {
      "from": "node_mex4d",
      "to": "node_mexzw",
      "distancePx": 22
    },
    {
      "from": "node_mexzw",
      "to": "node_mezdy",
      "distancePx": 21
    },
    {
      "from": "node_mezdy",
      "to": "node_mf4o7",
      "distancePx": 31
    },
    {
      "from": "node_mf4o7",
      "to": "node_mf5j6",
      "distancePx": 28
    },
    {
      "from": "node_mf5j6",
      "to": "node_mf6dp",
      "distancePx": 28
    },
    {
      "from": "node_mf6dp",
      "to": "node_mf7if",
      "distancePx": 28
    },
    {
      "from": "node_mf7if",
      "to": "node_mf99v",
      "distancePx": 25
    },
    {
      "from": "node_mf99v",
      "to": "node_mfavr",
      "distancePx": 25
    },
    {
      "from": "node_mfavr",
      "to": "node_mfcdl",
      "distancePx": 30
    },
    {
      "from": "node_581uh",
      "to": "node_mfcdl",
      "distancePx": 26
    },
    {
      "from": "node_715it",
      "to": "node_me0ny",
      "distancePx": 30
    },
    {
      "from": "node_msu38",
      "to": "node_msv2n",
      "distancePx": 28
    },
    {
      "from": "node_msv2n",
      "to": "node_7135m",
      "distancePx": 25
    },
    {
      "from": "node_mtjds",
      "to": "node_mtkhi",
      "distancePx": 42
    },
    {
      "from": "node_mtkhi",
      "to": "node_8f90y",
      "distancePx": 36
    }
  ],
  "accessPoints": {
    "1": {
      "positionId": 1,
      "pixelCoord": {
        "x": 517.7,
        "y": 600.8
      },
      "normalizedCoord": {
        "x": 0.404453125,
        "y": 0.7762273901808785
      },
      "connectedRoadNodeId": "node_47rcy",
      "label": "Position 1 Access"
    },
    "2": {
      "positionId": 2,
      "pixelCoord": {
        "x": 768.7,
        "y": 449.5
      },
      "normalizedCoord": {
        "x": 0.600546875,
        "y": 0.5807493540051679
      },
      "connectedRoadNodeId": "node_581uh",
      "label": "Position 2 Access"
    },
    "3": {
      "positionId": 3,
      "pixelCoord": {
        "x": 771.2,
        "y": 518
      },
      "normalizedCoord": {
        "x": 0.6025,
        "y": 0.6692506459948321
      },
      "connectedRoadNodeId": "node_56s0v",
      "label": "Position 3 Access"
    },
    "4": {
      "positionId": 4,
      "pixelCoord": {
        "x": 850.2,
        "y": 312.2
      },
      "normalizedCoord": {
        "x": 0.6642187500000001,
        "y": 0.40335917312661496
      },
      "connectedRoadNodeId": "node_5obxd",
      "label": "Position 4 Access"
    },
    "5": {
      "positionId": 5,
      "pixelCoord": {
        "x": 629.7,
        "y": 269.5
      },
      "normalizedCoord": {
        "x": 0.49195312500000005,
        "y": 0.3481912144702842
      },
      "connectedRoadNodeId": "node_07j9z",
      "label": "Position 5 Access"
    },
    "6": {
      "positionId": 6,
      "pixelCoord": {
        "x": 660.4,
        "y": 221.2
      },
      "normalizedCoord": {
        "x": 0.5159374999999999,
        "y": 0.28578811369509044
      },
      "connectedRoadNodeId": "node_0ln5z",
      "label": "Position 6 Access"
    },
    "7": {
      "positionId": 7,
      "pixelCoord": {
        "x": 368.3,
        "y": 172.1
      },
      "normalizedCoord": {
        "x": 0.287734375,
        "y": 0.2223514211886305
      },
      "connectedRoadNodeId": "node_0qpk6",
      "label": "Position 7 Access"
    },
    "8": {
      "positionId": 8,
      "pixelCoord": {
        "x": 450.2,
        "y": 111
      },
      "normalizedCoord": {
        "x": 0.35171874999999997,
        "y": 0.1434108527131783
      },
      "connectedRoadNodeId": "node_0tguj",
      "label": "Position 8 Access"
    },
    "9": {
      "positionId": 9,
      "pixelCoord": {
        "x": 940.1,
        "y": 342.3
      },
      "normalizedCoord": {
        "x": 0.734453125,
        "y": 0.4422480620155039
      },
      "connectedRoadNodeId": "node_715it",
      "label": "Position 9 Access"
    },
    "10": {
      "positionId": 10,
      "pixelCoord": {
        "x": 915.1,
        "y": 213.7
      },
      "normalizedCoord": {
        "x": 0.714921875,
        "y": 0.27609819121447027
      },
      "connectedRoadNodeId": "node_8f90y",
      "label": "Position 10 Access"
    },
    "11": {
      "positionId": 11,
      "pixelCoord": {
        "x": 1082.5,
        "y": 394.5
      },
      "normalizedCoord": {
        "x": 0.845703125,
        "y": 0.5096899224806202
      },
      "connectedRoadNodeId": "node_mec1s",
      "label": "Position 11 Access"
    },
    "12": {
      "positionId": 12,
      "pixelCoord": {
        "x": 911.4,
        "y": 274.3
      },
      "normalizedCoord": {
        "x": 0.71203125,
        "y": 0.3543927648578811
      },
      "connectedRoadNodeId": "node_msu38",
      "label": "Position 12 Access"
    }
  }
};

/**
 * Return deep clone of verified default baseline road network
 */
export function getDefaultRoadNetworkData(): RoadNetworkData {
  return JSON.parse(JSON.stringify(VERIFIED_MANUAL_ROAD_DATA));
}

/**
 * Build graph structure with Euclidean distances and adjacency list from RoadNetworkData
 */
export function buildRoadGraphFromData(data: RoadNetworkData): RoadGraph {
  const nodes: Record<string, RoadNode> = { ...data.nodes };
  const adjacencyList: Record<string, { to: string; weight: number }[]> = {};

  for (const id of Object.keys(nodes)) {
    adjacencyList[id] = [];
  }

  const edges: RoadEdge[] = [];

  for (const rawEdge of data.edges) {
    const fromNode = nodes[rawEdge.from];
    const toNode = nodes[rawEdge.to];

    if (!fromNode || !toNode) {
      continue;
    }

    if (!adjacencyList[rawEdge.from]) adjacencyList[rawEdge.from] = [];
    if (!adjacencyList[rawEdge.to]) adjacencyList[rawEdge.to] = [];

    const dx = toNode.pixelCoord.x - fromNode.pixelCoord.x;
    const dy = toNode.pixelCoord.y - fromNode.pixelCoord.y;
    const distancePx = rawEdge.distancePx || (rawEdge as any).distance || Math.round(Math.hypot(dx, dy) * 10) / 10;

    const edge: RoadEdge = {
      from: rawEdge.from,
      to: rawEdge.to,
      distancePx,
      isCoveredWalkway: rawEdge.isCoveredWalkway,
      fieldVerificationNeeded: rawEdge.fieldVerificationNeeded,
    };

    edges.push(edge);

    // Bidirectional walking graph
    adjacencyList[rawEdge.from].push({ to: rawEdge.to, weight: distancePx });
    adjacencyList[rawEdge.to].push({ to: rawEdge.from, weight: distancePx });
  }

  return { nodes, edges, adjacencyList };
}

/**
 * Resolve the South Entrance node from the active road graph nodes.
 * 1. Explicitly marked node (isEntrance === true)
 * 2. Node with id === 'entrance' or id containing 'entrance'
 * 3. Node labeled with 'south entrance' or 'main entrance'
 * 4. Automatic fallback: Southernmost node (highest Y pixel coordinate)
 */
export function getEntranceNode(nodes: Record<string, RoadNode>): RoadNode | null {
  const allNodes = Object.values(nodes);
  if (allNodes.length === 0) return null;

  // 1. Explicitly marked entrance
  const explicit = allNodes.find((n) => n.isEntrance);
  if (explicit) return explicit;

  // 2. Exact ID match 'entrance'
  if (nodes['entrance']) return nodes['entrance'];

  // 3. Label match specifically for south or main entrance/gate
  const byMainEntrance = allNodes.find(
    (n) =>
      n.label?.toLowerCase().includes('south entrance') ||
      n.label?.toLowerCase().includes('main entrance') ||
      n.label?.toLowerCase().includes('south gate')
  );
  if (byMainEntrance) return byMainEntrance;

  // 4. Southernmost node: highest Y
  let southernmost = allNodes[0];
  for (const n of allNodes) {
    if (n.pixelCoord.y > southernmost.pixelCoord.y) {
      southernmost = n;
    }
  }
  return southernmost;
}

export const CAMPUS_ROAD_GRAPH = buildRoadGraphFromData(getDefaultRoadNetworkData());
