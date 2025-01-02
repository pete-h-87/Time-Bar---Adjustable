const dummyData = [
  {
    ID: 1,
    Start: 6.0,
    End: 9.5,
    Text: "Bandak: Service on machine",
    Status: "T",
  },
  {
    ID: 2,
    Start: 9.5,
    End: 11.5,
    Text: "Bandak: Service on machine",
    Status: "W",
  },
  {
    ID: 3,
    Start: 12.0,
    End: 15.0,
    Text: "Bandak: Adjustment of gantry",
    Status: "W",
  },
  {
    ID: 4,
    Start: 15.0,
    End: 19.0,
    Text: "Bandak: Adjustment of gantry",
    Status: "T",
  },
];

const defaultTasks = [
  "Bandak: Service on machine",
  "Bandak: Service on gantry",
  "Bandak: Service on valves",
  "Bandak: Service on hydraulics",
];

export { dummyData, defaultTasks };