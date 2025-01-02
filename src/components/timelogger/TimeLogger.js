import React, { useState, useEffect } from "react";
import styles from "./TimeLogger.module.css";
import { dummyData, defaultTasks } from "../../data/dummyData";

//CALCULATION STATES -REFS
const startTimeRef = React.createRef();
const endTimeRef = React.createRef();
const mouseMoveMode = React.createRef("");
const mouseDownXPos = React.createRef(0);
const canvasMouseDownXPos = React.createRef(0);
const cursorElementRef = React.createRef();
const resizingStart = React.createRef(false);
const canvasRef = React.createRef(false);
const spanRef = React.createRef();
const spanClickedRef = React.createRef(false);
const yRef = React.createRef();

export default function TimeLogger() {
  //UI STATES
  const [time, setTime] = useState();
  const [selectedItem, setSelectedItem] = useState(null);
  const [datasource, setDatasource] = useState(dummyData);
  const [canvasClicked, setCanvasClicked] = useState(false);
  const [previousSelectedItem, setPreviousSelectItem] = useState(null);

  //CONVERTER FUNCTIONS
  function decimalToXpoint(hourDecimal) {
    let posFactor = hourDecimal / 24;
    let posX = 510 * posFactor;
    posX += 100;
    return posX;
  }

  function xPosToHourDecimal(e) {
    let relativePos = e.clientX - e.target.offsetLeft;
    let totalWidth = e.target.offsetWidth;
    let positionFactor = relativePos / totalWidth;
    let hoursDecimal = Math.round(24 * positionFactor * 4) / 4;
    return hoursDecimal;
  }

  function pad(num, size) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
  }

  //KEYDOWN LISTENER
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "w" && selectedItem) {
        const newState = datasource.map((item) =>
          item.ID === selectedItem.ID ? { ...item, Status: "W" } : item
        );
        setDatasource(newState);
      } else if (e.key === "t" && selectedItem) {
        const newState = datasource.map((item) =>
          item.ID === selectedItem.ID ? { ...item, Status: "T" } : item
        );
        setDatasource(newState);
      } else if (e.key === "Delete" && selectedItem) {
        const newState = datasource.filter(
          (item) => item.ID !== selectedItem.ID
        );
        setDatasource(newState);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedItem, datasource]);

  //EXISTING TIMESPANS - CLICK, MOVE, AND RESIZE FUNCTIONS
  function timespanMouseDown(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    spanClickedRef.current = true;
    yRef.current = e.clientY;
    let clickedItemData = e.target.dataset["id"];
    if (clickedItemData) {
      let id = Number(clickedItemData);
      let item = datasource.find((element) => element.ID === id);
      setSelectedItem(item);
      setPreviousSelectItem(item);
      let moveMode = "itemMove";
      let hasNeighbor = false;
      for (let index = 0; index < datasource.length; index++) {
        const anElement = datasource[index];
        const target = e.target.dataset;
        if (
          Number(target.end) === anElement.Start ||
          Number(target.start) === anElement.End
        ) {
          hasNeighbor = true;
          break;
        }
      }
      for (let index = 0; index < datasource.length; index++) {
        const anElement = datasource[index];
        const target = e.target.dataset;
        if (e.clientX > e.target.offsetLeft + e.target.offsetWidth * 0.8) {
          if (Number(target.end) === anElement.Start) {
            if (hasNeighbor) {
              moveMode = "itemResizeSplit";
              resizingStart.current = false;
              break;
            } else {
              moveMode = "itemResizeEnd";
            }
          } else {
            moveMode = "itemResizeEnd";
          }
        } else if (
          e.clientX <
          e.target.offsetLeft + e.target.offsetWidth * 0.2
        ) {
          if (Number(target.start) === anElement.End) {
            if (hasNeighbor) {
              moveMode = "itemResizeSplit";
              resizingStart.current = true;
              break;
            } else {
              moveMode = "itemResizeStart";
            }
          } else {
            moveMode = "itemResizeStart";
          }
        }
      }
      mouseMoveMode.current = moveMode;
      mouseDownXPos.current = e.clientX;
      document.body.classList.add("loading");
    }
  }

  function timespanMouseMove(e) {
    e.preventDefault();
    spanRef.current = true;
    if (
      (selectedItem && mouseMoveMode.current === "itemMove") ||
      mouseMoveMode.current === "itemResizeStart" ||
      mouseMoveMode.current === "itemResizeEnd"
    ) {
      handleItemMoveAndResize(e);
    } else if (mouseMoveMode.current === "itemResizeSplit") {
      handleSplitResize(e);
    }
    let cursorClass;
    let hasNeighbor = false;
    for (let index = 0; index < datasource.length; index++) {
      const anElement = datasource[index];
      const target = e.target.dataset;
      if (
        Number(target.end) === anElement.Start ||
        Number(target.start) === anElement.End
      ) {
        hasNeighbor = true;
        break;
      }
    }
    for (let index = 0; index < datasource.length; index++) {
      const anElement = datasource[index];
      const target = e.target.dataset;
      const divId = Number(target.id);
      if (
        e.clientX > e.target.offsetLeft + e.target.offsetWidth * 0.8 &&
        datasource.some((item) => item.ID === divId)
      ) {
        if (Number(target.end) === anElement.Start) {
          if (hasNeighbor) {
            cursorClass = "cursor-col-resize";
            break;
          } else {
            cursorClass = "cursor-w-resize";
          }
        } else {
          cursorClass = "cursor-w-resize";
        }
      } else if (
        e.clientX < e.target.offsetLeft + e.target.offsetWidth * 0.2 &&
        datasource.some((item) => item.ID === divId)
      ) {
        if (Number(target.start) === anElement.End) {
          if (hasNeighbor) {
            cursorClass = "cursor-col-resize";
            break;
          } else {
            cursorClass = "cursor-w-resize";
          }
        } else {
          cursorClass = "cursor-w-resize";
        }
      }
    }
    removeMoveCursor();
    cursorElementRef.current = {
      cursor: cursorClass,
      element: e.target,
    };
    e.target.classList.add(cursorClass);
  }

  function handleItemMoveAndResize(e) {
    e.preventDefault();
    let nowPosX = e.clientX;
    let distancePoints = nowPosX - mouseDownXPos.current;
    if (Math.abs(distancePoints) < 5) return; //increment by .25, or 15 minutes
    let timeMovedFactor = distancePoints / 510;
    let timeMovedHours = timeMovedFactor * 24;
    let newState = [...datasource];
    let clickedSpan = newState.find((item) => item.ID === selectedItem.ID);
    let newStart = clickedSpan.Start + Math.round(timeMovedHours * 4) / 4;
    let newEnd = clickedSpan.End + Math.round(timeMovedHours * 4) / 4;
    const currentY = e.clientY;
    const deltaY = currentY - yRef.current;
    if (distancePoints > 0 && mouseMoveMode.current === "itemMove") {
      newEnd = getOverlapBorder(newEnd, true, true);
      newStart = getOverlapBorder(newStart, true, false);
      if (deltaY > 50 && deltaY < 100) {
        newStart = clickedSpan.Start + Math.round(timeMovedHours * 4) / 12;
        newEnd = clickedSpan.End + Math.round(timeMovedHours * 4) / 12;
        newEnd = getOverlapBorder(newEnd, true, true);
        newStart = getOverlapBorder(newStart, true, false);
      } else if (deltaY >= 100) {
        newStart = clickedSpan.Start + Math.round(timeMovedHours * 4) / 60;
        newEnd = clickedSpan.End + Math.round(timeMovedHours * 4) / 60;
      }
    } else if (distancePoints < 0 && mouseMoveMode.current === "itemMove") {
      newEnd = getOverlapBorder(newEnd, false, false);
      newStart = getOverlapBorder(newStart, false, true);
      if (deltaY > 50 && deltaY < 100) {
        newStart = clickedSpan.Start + Math.round(timeMovedHours * 4) / 12;
        newEnd = clickedSpan.End + Math.round(timeMovedHours * 4) / 12;
        newEnd = getOverlapBorder(newEnd, true, true);
        newStart = getOverlapBorder(newStart, true, false);
      } else if (deltaY >= 100) {
        newStart = clickedSpan.Start + Math.round(timeMovedHours * 4) / 60;
        newEnd = clickedSpan.End + Math.round(timeMovedHours * 4) / 60;
      }
    }
    if (
      mouseMoveMode.current === "itemResizeStart" ||
      mouseMoveMode.current === "itemMove"
    ) {
      clickedSpan.Start = newStart;
      if (clickedSpan.Start >= clickedSpan.End - 0.5) {
        clickedSpan.Start = clickedSpan.End - 0.5;
      }
    }
    if (
      mouseMoveMode.current === "itemResizeEnd" ||
      mouseMoveMode.current === "itemMove"
    ) {
      clickedSpan.End = newEnd;
      if (clickedSpan.End <= clickedSpan.Start + 0.5) {
        clickedSpan.End = clickedSpan.Start + 0.5;
      }
    }
    if (distancePoints < 0 && mouseMoveMode.current === "itemResizeStart") {
      newStart = getOverlapBorder(newStart, false, true);
      clickedSpan.Start = newStart;
    }
    if (distancePoints > 0 && mouseMoveMode.current === "itemResizeEnd") {
      newEnd = getOverlapBorder(newEnd, true, true);
      clickedSpan.End = newEnd;
    }
    mouseDownXPos.current = e.clientX;
    setDatasource(newState);
  }

  function handleSplitResize(e) {
    e.preventDefault();
    let nowPosX = e.clientX;
    let distancePoints = nowPosX - mouseDownXPos.current;
    if (Math.abs(distancePoints) < 5) return;
    let timeMovedFactor = distancePoints / 510;
    let timeMovedHours = timeMovedFactor * 24;
    let newState = [...datasource];
    let clickedSpan = newState.find((item) => item.ID === selectedItem.ID);
    let neighbor = newState.find(
      (item) =>
        (item.End === selectedItem.Start && resizingStart.current) ||
        (item.Start === selectedItem.End && !resizingStart.current)
    );
    let newStart = clickedSpan.Start + Math.round(timeMovedHours * 4) / 4;
    let newEnd = clickedSpan.End + Math.round(timeMovedHours * 4) / 4;
    let newNeighborStart = neighbor.Start + Math.round(timeMovedHours * 4) / 4;
    let newNeighborEnd = neighbor.End + Math.round(timeMovedHours * 4) / 4;
    if (distancePoints !== 0) {
      if (clickedSpan.Start < neighbor.Start) {
        clickedSpan.End = newEnd;
        neighbor.Start = newNeighborStart;
      } else {
        clickedSpan.Start = newStart;
        neighbor.End = newNeighborEnd;
      }
    }
    mouseDownXPos.current = e.clientX;
    setDatasource(newState);
  }

  function timespanMouseUp(e) {
    e.preventDefault();
    spanClickedRef.current = false;
    spanRef.current = false;
    mouseMoveMode.current = "";
    document.body.classList.remove("loading");
    setSelectedItem(null);
  }

  //TASK SETTING FUNCTIONS
  function handleRightClick(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById("myDropdown").classList.toggle(styles.show);
    let clickedItemData = e.target.dataset["id"];
    let id = Number(clickedItemData);
    let clickedSpan = datasource.find((item) => item.ID === id);
    setSelectedItem(clickedSpan);
  }

  function handleTaskClick(e, text) {
    selectedItem.Text = text;
    setSelectedItem({ ...selectedItem });
    document.getElementById("myDropdown").classList.remove(styles.show);
  }

  //EVENT LISTENERS
  useEffect(() => {
    if (!canvasClicked) {
      document.addEventListener("mousedown", timespanMouseDown);
      document.addEventListener("mousemove", timespanMouseMove);
      document.addEventListener("mouseup", timespanMouseUp);
      return () => {
        document.removeEventListener("mousedown", timespanMouseDown);
        document.removeEventListener("mousemove", timespanMouseMove);
        document.removeEventListener("mouseup", timespanMouseUp);
      };
    }

    if (canvasClicked) {
      document.addEventListener("mousemove", canvasMouseMove);
      document.addEventListener("mouseup", canvasMouseUp);
      return () => {
        document.removeEventListener("mousemove", canvasMouseMove);
        document.removeEventListener("mouseup", canvasMouseUp);
      };
    }
  });

  //NEW TIMESPAN CREATION FUNCTIONS
  function canvasMouseDown(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    yRef.current = e.clientY;
    setCanvasClicked(true);
    startTimeRef.current = xPosToHourDecimal(e);
    endTimeRef.current = e.target.dataset.End;
    let newState = [...datasource];
    let newItem = {
      ID:
        datasource.length > 0
          ? Math.max(...datasource.map((item) => item.ID)) + 1
          : 1,
      Start: startTimeRef.current,
      End: startTimeRef.current,
      Text: "",
      Status: "",
    };
    newState.push(newItem);
    setDatasource(newState);
    setSelectedItem(newItem);
    mouseMoveMode.current = "newItemEnd";
    canvasMouseDownXPos.current = e.clientX;
  }

  function canvasMouseHover(e) {
    e.preventDefault();
    removeMoveCursor();
    let relativePos = e.clientX - canvasRef.current.offsetLeft;
    let totalWidth = canvasRef.current.offsetWidth;
    let positionFactor = relativePos / totalWidth;
    let hoursDecimal = 24 * positionFactor;
    let hours = Math.floor(hoursDecimal);
    let minutes = hoursDecimal - hours;
    minutes = minutes * 60;
    minutes = Math.round(minutes / 5) * 5;
    setTime(pad(hours, 2) + ":" + pad(minutes, 2));
  }

  function canvasMouseMove(e) {
    e.preventDefault();
    if (mouseMoveMode.current === "newItemEnd") {
      let nowPosX = e.clientX;
      let distancePoints = nowPosX - canvasMouseDownXPos.current;
      if (Math.abs(distancePoints) < 5) return; //increment by .25, or 15 minutes
      let timeMovedFactor = distancePoints / 510;
      let timeMovedHours = timeMovedFactor * 24;
      let newState = [...datasource];
      let changedItem = newState.find((item) => item.ID === selectedItem.ID);
      let newEnd = startTimeRef.current + Math.round(timeMovedHours * 4) / 4;
      // const currentY = e.clientY;
      // const deltaY = currentY - yRef.current;
      if (distancePoints > 0 && mouseMoveMode.current === "newItemEnd") {
        newEnd = getOverlapBorder(newEnd, true, true);
        changedItem.End = newEnd;
        // if (deltaY > 50 && deltaY < 100) {
        //   const x = (Math.round(timeMovedHours * 4) / 12)
        //   console.log(x)
        //   newEnd = changedItem.End + (Math.round(timeMovedHours * 4) / 12);
        //   console.log("new end", timeMovedHours);
        //   changedItem.End = newEnd;
        //   // newEnd = getOverlapBorder(newEnd, true, true);
        // } else if (deltaY >= 100) {
        //   newEnd = startTimeRef.current + Math.round(timeMovedHours * 4) / 60;
        //   changedItem.End = newEnd;
        // }
      } else if (distancePoints < 0 && mouseMoveMode.current === "newItemEnd") {
        let newStart = Math.round(timeMovedHours * 4) / 4 + changedItem.End;
        newStart = getOverlapBorder(newStart, false, true);
        changedItem.Start = newStart;
      }
      setDatasource(newState);
    }
  }

  function canvasMouseUp(e) {
    e.preventDefault();
    setCanvasClicked(false);
    mouseMoveMode.current = "";
    removeMoveCursor();
    setSelectedItem(null);
    setPreviousSelectItem(selectedItem);
  }

  //HELPER FUNCITONS
  function removeMoveCursor() {
    if (cursorElementRef.current) {
      cursorElementRef.current.element.classList.remove(
        cursorElementRef.current.cursor
      );
    }
  }

  function getOverlapBorder(newTime, directionRight, leadingEdge) {
    let lastValidStartTime = selectedItem.Start;
    let lastValidEndTime = selectedItem.End;
    let result = newTime;
    for (let index = 0; index < datasource.length; index++) {
      const element = datasource[index];
      if (element.ID !== selectedItem.ID) {
        if (directionRight === true) {
          if (leadingEdge === true) {
            if (newTime > element.Start && newTime < element.End) {
              result = element.Start;
            }
          } else if (leadingEdge === false) {
            if (
              selectedItem.End >= element.Start &&
              selectedItem.End <= element.End
            ) {
              result = lastValidStartTime;
            }
          }
        } else if (directionRight === false) {
          if (leadingEdge === true) {
            if (newTime < element.End && newTime > element.Start) {
              result = element.End;
            }
          } else if (leadingEdge === false) {
            if (
              selectedItem.Start >= element.Start &&
              selectedItem.Start <= element.End
            ) {
              result = lastValidEndTime;
            }
          }
        }
      }
    }
    return result;
  }

  return (
    <div>
      <div className={styles.bigContainer}>
        <div className={styles.timeDivAndCanv}>
          <div style={{ margin: "30px 0 0 100px" }} className={styles.timeDiv}>
            <div>00:00</div>
            <div>24:00</div>
          </div>
          <div
            className={styles.canvas}
            id="canvas"
            ref={canvasRef}
            onMouseMove={canvasMouseHover}
            onMouseDown={canvasMouseDown}
          />
        </div>
        {datasource.map((item) => (
          <div>
            <div>
              <button
                ref={spanRef}
                key={item.ID}
                data-id={item.ID}
                data-start={item.Start}
                data-end={item.End}
                data-text={item.Text}
                style={{
                  position: "absolute",
                  left: decimalToXpoint(item.Start),
                  top: "60px",
                  width:
                    decimalToXpoint(item.End) - decimalToXpoint(item.Start),
                  height: "40px",
                  backgroundColor: item.Status == "W" ? "red" : "blue",
                  border:
                    selectedItem &&
                    selectedItem.ID === item.ID &&
                    mouseMoveMode.current !== "itemResizeSplit"
                      ? "2px solid yellow"
                      : "1px solid black",
                  borderRadius: "5px",
                }}
                title={item.Text}
                onContextMenu={handleRightClick}
                className={styles.dropbtn}
              >
                <div id="myDropdown" className={styles.dropdownContent}>
                  {defaultTasks.map((text, index) => (
                    <a
                      key={index}
                      href={`taskNumber: ${index}`}
                      onMouseDown={(e) => handleTaskClick(e, text)}
                    >
                      {text}
                    </a>
                  ))}
                </div>
              </button>
            </div>
          </div>
        ))}
        <div className={styles.infoContainer}>
          <div className={styles.welcome}>
            Click around! Refresh when needed.
          </div>
          <div className={styles.theTime}>Time: {time}</div>
          <div className={styles.theData}>
            Clicked Item:{" "}
            {previousSelectedItem ? (
              <div className={styles.information}>
                <div>ID: {previousSelectedItem.ID}</div>
                <div>
                  Start:{" "}
                  {previousSelectedItem.Start
                    ? previousSelectedItem.Start
                    : "N/A"}
                </div>
                <div>End: {previousSelectedItem.End}</div>
                <div>
                  Job:{" "}
                  {previousSelectedItem.Text
                    ? previousSelectedItem.Text
                    : "**Right-click the timespan to set job"}
                </div>
                <div>
                  Status:{" "}
                  {previousSelectedItem.Status
                    ? previousSelectedItem.Status
                    : "**Hold T or W while clicking to change status"}
                </div>
              </div>
            ) : (
              "**click on a span!*"
            )}
          </div>
          <div className={styles.instructions}>
            <ul>
              <li>Click and drag on light blue to create a new time</li>
              <li>Click and drag a time span to move it around</li>
              <li>Click and drag the start/end to adjust</li>
              <li>Hold delete and left-click a span to delete</li>
              <li>Hold W or T and left-click a span to change status</li>
              <li>Right-click to bring up a menu to change job description</li>
              <li>To scrub, drag mouse down while dragging span</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
