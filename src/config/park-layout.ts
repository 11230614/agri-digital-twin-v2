import type {Vec3} from '../shared/contracts/spatial';
export interface Installation {readonly id:string;readonly positionM:Vec3}
export interface RoadDefinition {readonly id:string;readonly fromM:Vec3;readonly toM:Vec3;readonly widthM:number;readonly kind:'road'|'path'}
/** User approved compact candidate02 parameters on 2026-11-14; static visual review still pending. */
export const PARK_LAYOUT={
  "key": "park-layout-candidate-02",
  "reference": "user-approved compact-02 parameters",
  "widthM": 108,
  "lengthM": 90,
  "greenhouses": [
    {
      "id": "greenhouse-01",
      "positionM": [
        24,
        0,
        -55
      ]
    },
    {
      "id": "greenhouse-02",
      "positionM": [
        54,
        0,
        -55
      ]
    },
    {
      "id": "greenhouse-03",
      "positionM": [
        84,
        0,
        -55
      ]
    }
  ],
  "plots": [
    {
      "id": "plot-01",
      "positionM": [
        20,
        0,
        -29
      ]
    },
    {
      "id": "plot-02",
      "positionM": [
        54,
        0,
        -29
      ]
    },
    {
      "id": "plot-03",
      "positionM": [
        88,
        0,
        -29
      ]
    }
  ],
  "solarGroup": {
    "id": "solar-group-01",
    "positionM": [
      18,
      0,
      -9
    ]
  },
  "weather": [
    {
      "id": "weather-01",
      "positionM": [
        33.2,
        0,
        -41
      ]
    },
    {
      "id": "weather-02",
      "positionM": [
        67.2,
        0,
        -41
      ]
    },
    {
      "id": "weather-03",
      "positionM": [
        101.2,
        0,
        -41
      ]
    }
  ],
  "controllers": [
    {
      "id": "controller-01",
      "positionM": [
        33,
        0,
        -11
      ]
    },
    {
      "id": "controller-02",
      "positionM": [
        67,
        0,
        -11
      ]
    },
    {
      "id": "controller-03",
      "positionM": [
        101,
        0,
        -11
      ]
    }
  ],
  "sensors": [
    {
      "id": "plot-01:sensor-01",
      "positionM": [
        33.2,
        0,
        -19
      ]
    },
    {
      "id": "plot-01:sensor-02",
      "positionM": [
        33.2,
        0,
        -29
      ]
    },
    {
      "id": "plot-01:sensor-03",
      "positionM": [
        33.2,
        0,
        -39
      ]
    },
    {
      "id": "plot-02:sensor-01",
      "positionM": [
        67.2,
        0,
        -19
      ]
    },
    {
      "id": "plot-02:sensor-02",
      "positionM": [
        67.2,
        0,
        -29
      ]
    },
    {
      "id": "plot-02:sensor-03",
      "positionM": [
        67.2,
        0,
        -39
      ]
    },
    {
      "id": "plot-03:sensor-01",
      "positionM": [
        101.2,
        0,
        -19
      ]
    },
    {
      "id": "plot-03:sensor-02",
      "positionM": [
        101.2,
        0,
        -29
      ]
    },
    {
      "id": "plot-03:sensor-03",
      "positionM": [
        101.2,
        0,
        -39
      ]
    }
  ],
  "trees": [
    {
      "id": "tree-01",
      "positionM": [
        -5,
        0,
        -18
      ]
    },
    {
      "id": "tree-02",
      "positionM": [
        -5,
        0,
        -45
      ]
    },
    {
      "id": "tree-03",
      "positionM": [
        -5,
        0,
        -72
      ]
    },
    {
      "id": "tree-04",
      "positionM": [
        113,
        0,
        -18
      ]
    },
    {
      "id": "tree-05",
      "positionM": [
        113,
        0,
        -45
      ]
    },
    {
      "id": "tree-06",
      "positionM": [
        113,
        0,
        -72
      ]
    },
    {
      "id": "tree-07",
      "positionM": [
        27,
        0,
        -95
      ]
    },
    {
      "id": "tree-08",
      "positionM": [
        81,
        0,
        -95
      ]
    }
  ],
  "solarTables": [
    {
      "id": "solar-table-01",
      "positionM": [
        -5,
        0,
        -2
      ]
    },
    {
      "id": "solar-table-02",
      "positionM": [
        5,
        0,
        -2
      ]
    },
    {
      "id": "solar-table-03",
      "positionM": [
        -5,
        0,
        2
      ]
    },
    {
      "id": "solar-table-04",
      "positionM": [
        5,
        0,
        2
      ]
    }
  ]
} as const;
export const PARK_ROADS:readonly RoadDefinition[]=[
  {
    "id": "road-south",
    "fromM": [
      3,
      0.02,
      -2
    ],
    "toM": [
      105,
      0.02,
      -2
    ],
    "widthM": 4,
    "kind": "road"
  },
  {
    "id": "road-east",
    "fromM": [
      105,
      0.02,
      -2
    ],
    "toM": [
      105,
      0.02,
      -87
    ],
    "widthM": 4,
    "kind": "road"
  },
  {
    "id": "road-north",
    "fromM": [
      105,
      0.02,
      -87
    ],
    "toM": [
      3,
      0.02,
      -87
    ],
    "widthM": 4,
    "kind": "road"
  },
  {
    "id": "road-west",
    "fromM": [
      3,
      0.02,
      -87
    ],
    "toM": [
      3,
      0.02,
      -2
    ],
    "widthM": 4,
    "kind": "road"
  },
  {
    "id": "road-main",
    "fromM": [
      3,
      0.02,
      -50
    ],
    "toM": [
      105,
      0.02,
      -50
    ],
    "widthM": 6,
    "kind": "road"
  },
  {
    "id": "road-link-01",
    "fromM": [
      37,
      0.02,
      -2
    ],
    "toM": [
      37,
      0.02,
      -50
    ],
    "widthM": 4,
    "kind": "road"
  },
  {
    "id": "road-link-02",
    "fromM": [
      71,
      0.02,
      -2
    ],
    "toM": [
      71,
      0.02,
      -50
    ],
    "widthM": 4,
    "kind": "road"
  },
  {
    "id": "greenhouse-01:entrance-path",
    "fromM": [
      24,
      0.02,
      -53
    ],
    "toM": [
      24,
      0.02,
      -55
    ],
    "widthM": 3,
    "kind": "path"
  },
  {
    "id": "greenhouse-02:entrance-path",
    "fromM": [
      54,
      0.02,
      -53
    ],
    "toM": [
      54,
      0.02,
      -55
    ],
    "widthM": 3,
    "kind": "path"
  },
  {
    "id": "greenhouse-03:entrance-path",
    "fromM": [
      84,
      0.02,
      -53
    ],
    "toM": [
      84,
      0.02,
      -55
    ],
    "widthM": 3,
    "kind": "path"
  },
  {
    "id": "plot-01:north-path",
    "fromM": [
      20,
      0.02,
      -47
    ],
    "toM": [
      20,
      0.02,
      -45
    ],
    "widthM": 3,
    "kind": "path"
  },
  {
    "id": "plot-02:north-path",
    "fromM": [
      54,
      0.02,
      -47
    ],
    "toM": [
      54,
      0.02,
      -45
    ],
    "widthM": 3,
    "kind": "path"
  },
  {
    "id": "plot-03:north-path",
    "fromM": [
      88,
      0.02,
      -47
    ],
    "toM": [
      88,
      0.02,
      -45
    ],
    "widthM": 3,
    "kind": "path"
  },
  {
    "id": "plot-02:south-path",
    "fromM": [
      54,
      0.02,
      -4
    ],
    "toM": [
      54,
      0.02,
      -13
    ],
    "widthM": 2,
    "kind": "path"
  },
  {
    "id": "plot-03:south-path",
    "fromM": [
      88,
      0.02,
      -4
    ],
    "toM": [
      88,
      0.02,
      -13
    ],
    "widthM": 2,
    "kind": "path"
  },
  {
    "id": "solar-group-01:access-path",
    "fromM": [
      5,
      0.02,
      -9
    ],
    "toM": [
      8,
      0.02,
      -9
    ],
    "widthM": 2,
    "kind": "path"
  },
  {
    "id": "park:entrance-path",
    "fromM": [
      54,
      0.02,
      0
    ],
    "toM": [
      54,
      0.02,
      -0.5
    ],
    "widthM": 4,
    "kind": "path"
  }
];
export const PARK_COUNTS={greenhouses:3,plots:3,solarTables:4,trees:8,fieldLeaves:8040,greenhouseLeaves:2340,leaves:10380,tomatoes:30,weather:3,sensors:9,controllers:3} as const;
