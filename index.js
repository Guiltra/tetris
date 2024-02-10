// Constants

const TetrisBlocks = {
    I: ["#90e0ef", "1111////", 4],
    J: ["#0077b6", "100/111/", 3],
    L: ["#f77f00", "001/111/", 3],
    O: ["#e9c46a", "11//11//", 2],
    S: ["#99d98c", "011/110/", 3],
    T: ["#8E61B3", "010/111/", 3],
    Z: ["#9e2a2b", "110/011/", 3]
};

const TetrisBlocksShapes = {
    I: ["0000/1111/0000/0000", "0010/0010/0010/0010", "0000/0000/1111/0000", "0100/0100/0100/0100"],
    J: ["100/111/000", "011/010/010", "000/111/001", "010/010/110"],
    L: ["001/111/000", "010/010/011", "000/111/100", "110/010/010"],
    O: ["11/11", "11/11", "11/11", "11/11"],
    S: ["011/110/000", "010/011/001", "000/011/110", "100/110/010"],
    T: ["010/111/000", "010/011/010", "000/111/010", "010/110/010"],
    Z: ["110/011/000", "001/011/010", "000/110/011", "010/110/100"]
};

const TetrisElement = document.querySelector(".game .content")

// Global Variables

let tetrisGrid = [];
let tetrisNext = [];
let tetrisGameState = false;
let tetrisPauseState = null;
let tetrisScore = 0;
let tetrisPersonalBest = 0;

let tetrisClearRowState;
let tetrisHoldBlock;
let tetrisPosition;
let tetrisRotation;
let tetrisPreview;
let tetrisDropInterval;

// Functions

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function fillBackground() {
    const background = document.querySelector(".background");
    const iterations = Math.floor(window.innerWidth / 200) + 1;

    for (let i = 0; i < iterations; i++) {
        const bubble = document.createElement("li");
        
        const size = getRandomNumber(20, 100);
        const delay = getRandomNumber(0, 10);
        const duration = getRandomNumber(10, 60);
        
        bubble.style.setProperty("--size", `${size}px`);
        bubble.style.setProperty("--margin", `${i * 100 / iterations + 5}%`);
        bubble.style.setProperty("--delay", `${delay}s`);
        bubble.style.setProperty("--duration", `${duration}s`);
        
        background.appendChild(bubble);
    }
}

function hideTextGradually(parent, time) {
    const text = parent.textContent;
    const delay = time / (Math.ceil(text.length / 2));
    let lowerBound, upperBound;

    if (text.length % 2 === 0) {
        lowerBound = text.length / 2 - 1;
        upperBound = lowerBound + 2;
    } else {
        lowerBound = Math.floor(text.length / 2);
        upperBound = lowerBound + 1;
    }

    let replaceText = function () {
        parent.innerHTML = `${text.slice(0, lowerBound)}<span class="hidden">${text.slice(lowerBound, upperBound)}</span>${text.slice(upperBound)}`
        if (lowerBound !== 0) {
            lowerBound--;
            upperBound++;
            setTimeout(() => replaceText(parent, text, delay, lowerBound, upperBound), delay);
        }
    }

    replaceText(parent, text, delay, lowerBound, upperBound);
}

function createMiscGrids() {
    const createGrid = (parent, misc) => {
        const grid = document.createElement("div");
        grid.classList.add("grid");
        if (misc != null) {
            grid.classList.add(misc);
        }
        parent.appendChild(grid);
        
        for (let i = 0; i < 2; i++) {
            const row = document.createElement("div");
            row.classList.add("row");
            grid.appendChild(row);

            for (let j = 0; j < 4; j++) {
                const cell = document.createElement("div");
                cell.classList.add("misc-cell");

                cell.style.setProperty("--size", "0px");
                cell.style.setProperty("--color", "transparent");

                row.appendChild(cell);
            }
        }
    };

    const holdContent = document.querySelector(".hold .content");
    const nextContent = document.querySelector(".next .content");

    createGrid(holdContent, null);
    createGrid(holdContent, "masked");

    for (let i = 0; i < 3; i++) {
        createGrid(nextContent, null);
    }
    createGrid(nextContent, "masked");
}

function updateMiscGrid(grid, block) {
    const rows = grid.children;

    for (let i = 0; i < 2; i++) {
        const cells = rows[i].children;

        for (let j = 0; j < 4; j++) {
            const index = i * 4 + j;

            switch (TetrisBlocks[block][1][index]) {
                case "1":
                    cells[j].style.setProperty("--size", "15px");
                    cells[j].style.setProperty("--color", TetrisBlocks[block][0]);
                    break;
                case "0":
                    cells[j].style.setProperty("--size", "15px");
                    cells[j].style.setProperty("--color", "transparent");
                    break;
                default:
                    cells[j].style.setProperty("--size", "0px");
                    cells[j].style.setProperty("--color", "transparent");
            }
        }
    }

    rows[0].style.height = (block === "I") ? "100%" : "50%";
}

function createMainGrid() {
    const parent = document.querySelector(".game .content");
    for (let i = 0; i < 200; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");

        parent.appendChild(cell);
    }
}

function updateCells(indices, block) {
    const cells = document.querySelectorAll(".cell");

    for (let i = 0; i < indices.length; i++) {
        const row = indices[i][0];
        const column = indices[i][1];

        tetrisGrid[row][column] = block;

        let index;
        if (indices[i][0] >= 2) {
            index = (row - 2) * 10 + column;
            cells[index].style.backgroundColor = (block === 0) ? "transparent" : TetrisBlocks[block][0];
        }
    }
}

function getRandomBlock(exclude) {
    let options = "IJLOSTZ";
    for (let i = 0; i < exclude.length; i++) {
        options = options.replace(exclude[i], "");
    }

    return options[getRandomNumber(0, options.length)];
}

function placeBlock() {
    const length = TetrisBlocks[tetrisHoldBlock][2];
    tetrisPosition = [0, getRandomNumber(0, 10 - length)];
    tetrisRotation = 0;
    
    const indices = getBlockShapeLocation(tetrisHoldBlock, tetrisPosition, tetrisRotation);
    updateCells(indices, tetrisHoldBlock);
    setBlockPreview();
}

function getBlockShapeLocation(block, position, rotation) {
    let indices = [];

    const shape = TetrisBlocksShapes[block][rotation];
    const length = TetrisBlocks[block][2];

    let accumulation = [0, 0];
    for (let i = 0; i < shape.length; i++) {
        if (shape[i] === "1") {
            indices.push([position[0] + accumulation[0], position[1] + accumulation[1]]);
        }

        if (shape[i] === "/") {
            accumulation[0] += 1;
            accumulation[1] -= length;
        } else {
            accumulation[1] += 1;
        }
    }

    return indices;
}

function getBlockShapeRows(block, position, rotation) {
    let rows = new Array;

    const indices = getBlockShapeLocation(block, position, rotation);
    for (let i = 0; i < indices.length; i++) {
        const row = indices[i][0];

        if (!rows.includes(row)) {
            rows.push(row)
        }
    }

    return rows;
}

function moveBlock(transformation) {
    const keys = document.querySelectorAll("i");
    if (!keys[transformation].classList.contains("active")) {
        return;
    }

    if (tetrisGameState) {
        const positionOld = JSON.parse(JSON.stringify(tetrisPosition));
        const rotationOld = tetrisRotation;
        
        switch (transformation) {
            case 0:
                tetrisRotation = ((tetrisRotation - 1) % 4 + 4) % 4;
                break;
            case 1:
                tetrisPosition[1]--;
                break;
            case 2:
                dropBlock();
                return;
            case 3:
                tetrisPosition[1]++;
                break;
            case 4:
                tetrisRotation = (tetrisRotation + 1) % 4;
                break;
        }

        updateCells(getBlockShapeLocation(tetrisHoldBlock, positionOld, rotationOld), 0);
        const indices = getBlockShapeLocation(tetrisHoldBlock, tetrisPosition, tetrisRotation);

        for (let i = 0; i < indices.length; i++) {
            const row = indices[i][0];
            const column = indices[i][1];

            if (tetrisGrid[row][column] !== 0 || column < 0 || column > 9) {
                tetrisPosition = positionOld;
                tetrisRotation = rotationOld;

                updateCells(getBlockShapeLocation(tetrisHoldBlock, tetrisPosition, tetrisRotation), tetrisHoldBlock);
                return;
            }
        }

        fillBorderPreview(getBlockShapeLocation(tetrisHoldBlock, tetrisPreview, rotationOld), 0);
        setBlockPreview();
        updateCells(indices, tetrisHoldBlock);
    }
}

function dropBlock() {
    const found_collision = function() {
        const rows = getBlockShapeRows(tetrisHoldBlock, tetrisPreview, tetrisRotation);
        for (let i = 0; i < rows.length; i++) {
            if (rows[i] < 2) {
                endGame();
                return;
            }
        }

        fillBorderPreview(getBlockShapeLocation(tetrisHoldBlock, tetrisPreview, tetrisRotation), 0);

        updateScore(10);
        checkFilledRow();
        
        tetrisHoldBlock = tetrisNext[0];
        tetrisNext.push(getRandomBlock([]));

        const next = JSON.parse(JSON.stringify(tetrisNext));
        const altGrids = document.querySelectorAll(".grid");
        
        for (let i = 0; i < altGrids.length; i++) {
            altGrids[i].style.transition = "translate 0.5s";

            if (i === 1) {
                altGrids[i].style.translate = "0px 0px";
            }
            else if (i === 5) {
                altGrids[i].style.translate = "0px 98px";
            } else {
                altGrids[i].style.translate = "0px -98px";
            }

            setTimeout(() => {
                altGrids[i].style.removeProperty("transition");

                if (i === 1) {
                    altGrids[i].style.translate = "0px 98px";
                }
                else if (i === 5) {
                    altGrids[i].style.translate = "0px 196px";
                } else {
                    altGrids[i].style.translate = "0px 0px";
                }

                if(i > 1){
                    updateMiscGrid(altGrids[i], next[i - 1])
                } else {
                    updateMiscGrid(altGrids[i], next[i])
                }
            }, 500)
        }
        
        tetrisNext.shift();
        placeBlock();

        if (tetrisClearRowState > 0) {
            clearInterval(tetrisDropInterval);
        }
    }
    
    // Pre-Collision Checks
    
    updateCells(getBlockShapeLocation(tetrisHoldBlock, tetrisPosition, tetrisRotation), 0);
    
    let newPosition = [tetrisPosition[0] + 1, tetrisPosition[1]];
    let collision = checkCollision(getBlockShapeLocation(tetrisHoldBlock, newPosition, tetrisRotation));
    
    updateCells(getBlockShapeLocation(tetrisHoldBlock, tetrisPosition, tetrisRotation), tetrisHoldBlock);
    
    if (!collision) {
        
        // Post-Collision Checks
        
        updateCells(getBlockShapeLocation(tetrisHoldBlock, tetrisPosition, tetrisRotation), 0);
        tetrisPosition[0] += 1;
        
        newPosition = [tetrisPosition[0] + 1, tetrisPosition[1]];
        collision = checkCollision(getBlockShapeLocation(tetrisHoldBlock, newPosition, tetrisRotation));
        
        updateCells(getBlockShapeLocation(tetrisHoldBlock, tetrisPosition, tetrisRotation), tetrisHoldBlock);
        
        if (collision) {
            found_collision();
        }
    } else {
        found_collision();
    }
}

function setBlockPreview() {
    updateCells(getBlockShapeLocation(tetrisHoldBlock, tetrisPosition, tetrisRotation), 0);

    for (let i = tetrisPosition[0]; i < 22 ; i++) {
        const indices = getBlockShapeLocation(tetrisHoldBlock, [i, tetrisPosition[1]], tetrisRotation);
        const next_indices = getBlockShapeLocation(tetrisHoldBlock, [i + 1, tetrisPosition[1]], tetrisRotation);

        const collision = checkCollision(next_indices);

        if (collision) {
            updateCells(getBlockShapeLocation(tetrisHoldBlock, tetrisPosition, tetrisRotation), tetrisHoldBlock);
            fillBorderPreview(indices, 1);
            tetrisPreview = [i, tetrisPosition[1]];
            return;
        }
    }

    updateCells(getBlockShapeLocation(tetrisHoldBlock, tetrisPosition, tetrisRotation), tetrisHoldBlock);
}

function fillBorderPreview(indices, border) {
    const cells = document.querySelectorAll(".cell");
    
    for (let i = 0; i < indices.length; i++) {
        const row = indices[i][0];
        const column = indices[i][1];
    
        let index;
        if (indices[i][0] >= 2) {
            index = (row - 2) * 10 + column;

            // ALT: ${TetrisBlocks[tetrisHoldBlock][0]}
            cells[index].style.border = (border === 0) ? "none" : `3px solid ${TetrisBlocks[tetrisHoldBlock][0]}`;
        }
    }
}

function checkCollision(indices) {
    for (let i = 0; i < indices.length; i++) {
        const row = indices[i][0];
        const column = indices[i][1];

        if (row >= 22 || tetrisGrid[row][column] !== 0) {
            return true;
        }
    }

    return false;
}

function checkFilledRow() {
    const rows = getBlockShapeRows(tetrisHoldBlock, tetrisPosition, tetrisRotation);

    let first_row;

    for (let i = 0; i < rows.length; i++) {
        let filled = 0;

        for (let j = 0; j < 10; j++) {
            if (tetrisGrid[rows[i]][j] !== 0) {
                filled++;
            }
        }

        if (filled === 10) {
            first_row = first_row === undefined ? rows[i] : first_row;

            TetrisElement.classList.remove("active");
            tetrisPauseState = null;
            tetrisClearRowState++;

            const keys = document.querySelectorAll("i");
            for (let i = 0; i < keys.length; i++) {
                keys[i].classList.remove("active");
            }

            updateScore(200);
            removeFilledRow(rows[i], 4, 5, first_row, tetrisClearRowState);
        }
    }
}

function removeFilledRow(row, lower_bound, upper_bound, first_row, length) {
    if (lower_bound >= 0) {
        updateCells([[row, lower_bound], [row, upper_bound]], 0);

        lower_bound--;
        upper_bound++;
        setTimeout(() => removeFilledRow(row, lower_bound, upper_bound, first_row, length), 100);
    }
    else {
        tetrisClearRowState--;

        if (tetrisClearRowState === 0) {
            setTimeout(() => {
                let clear_indices = new Array;
                let fill_indices = new Array;
                let fill_colors = new Array;

                for (let i = 2; i < first_row; i++) {
                    for (let j = 0; j < 10; j++) {
                        if (tetrisGrid[i][j] !== 0) {
                            clear_indices.push([i, j]);
                            fill_indices.push([i + length, j]);
                            fill_colors.push(tetrisGrid[i][j]);
                        }
                    }
                }

                updateCells(clear_indices, 0);

                for (let i = 0; i < fill_indices.length; i++) {
                    updateCells([fill_indices[i]], fill_colors[i]);
                }

                fillBorderPreview(getBlockShapeLocation(tetrisHoldBlock, tetrisPreview, tetrisRotation), 0);
                setBlockPreview();

                tetrisDropInterval = setInterval(() => {dropBlock()}, 500);

                TetrisElement.classList.add("active");
                tetrisPauseState = false;

                const keys = document.querySelectorAll("i");
                for (let i = 0; i < keys.length; i++) {
                    keys[i].classList.add("active");
                }
            }, 100)
        }
    }
}

function updateScore(score) {
    focus_text = function(paragraph) {
        paragraph.classList.add("focus");
        setTimeout(() => paragraph.classList.remove("focus"), 500)
    }

    const stats = document.querySelector(".stats");
    const paragraphs = stats.children;

    
    tetrisScore += score;
    paragraphs[1].textContent = tetrisScore;
    focus_text(paragraphs[1])

    if (tetrisScore > tetrisPersonalBest) {
        tetrisPersonalBest = tetrisScore;
        paragraphs[2].textContent = tetrisPersonalBest;
        focus_text(paragraphs[2])

        if (paragraphs[0].textContent === "SCORE") {
            paragraphs[0].textContent = "NEW BEST!";
            focus_text(paragraphs[0])
        }
    }
}

function startGame() {
    const stats = document.querySelector(".stats").children;
    const start = document.querySelector(".start");
    const paragraphs = document.querySelectorAll(".start p");
    paragraphs.forEach(paragraph => {paragraph.classList.add("zoom-in-out")});
    
    setTimeout(() => {
        stats[0].textContent = "SCORE";
        stats[1].textContent = "0";
        stats[2].textContent = tetrisPersonalBest;

        start.style.backgroundColor = "transparent";
        paragraphs[0].style.color = "white";

        paragraphs.forEach(paragraph => {
            paragraph.textContent = "";
            paragraph.classList.remove("zoom-in-out");
        })
        
        tetrisPauseState = false;
        tetrisClearRowState = 0;
        tetrisScore = 0;

        tetrisGrid = new Array;
        for (let i = 0; i < 22; i++) {
            tetrisGrid.push(new Array(10).fill(0));
        }

        const cells = document.querySelectorAll(".cell");
        cells.forEach(element => element.remove());
        createMainGrid();
        
        const altGrids = document.querySelectorAll(".grid");
        let excludeList = new Array;

        for (let i = 0; i < 6; i++) {
            if (i === 1) {
                continue;
            }

            const block = getRandomBlock(excludeList);
            excludeList.push(block);

            updateMiscGrid(altGrids[i], block);
            altGrids[i].classList.add("zoom-in");

            if (i === 0) {
                tetrisHoldBlock = block;
            } else {
                tetrisNext.push(block);
            }
        }

        altGrids[1].style.translate = "0px 98px";
        altGrids[5].style.translate = "0px 196px";
        updateMiscGrid(altGrids[1], tetrisNext[0]);

        const keys = document.querySelectorAll("i");
        for (let i = 0; i < keys.length; i++) {
            keys[i].classList.add("active");
        }

        placeBlock(tetrisHoldBlock);
        tetrisDropInterval = setInterval(() => {dropBlock()}, 500);
    }, 750)
}

function pauseGame() {
    const keys = document.querySelectorAll("i");
    for (let i = 0; i < keys.length; i++) {
        keys[i].classList.toggle("active");
    }

    const start = document.querySelector(".start");
    const paragraphs = start.children;
    tetrisPauseState = !tetrisPauseState;

    if (tetrisPauseState) {
        clearInterval(tetrisDropInterval);
        start.style.backgroundColor = "rgba(0, 0, 0, 0.2)";
        paragraphs[0].textContent = "PAUSE";
    } else {
        tetrisDropInterval = setInterval(() => {dropBlock()}, 500);
        start.style.backgroundColor = "transparent";
        paragraphs[0].textContent = "";
    }
}

function endGame() {
    const keys = document.querySelectorAll("i");
    for (let i = 0; i < keys.length; i++) {
        keys[i].classList.toggle("active");
    }

    const start = document.querySelector(".start");
    const paragraphs = start.children;

    start.style.backgroundColor = "rgba(0, 0, 0, 0.2)";
    paragraphs[0].textContent = "LOST";
    paragraphs[0].style.color = "red";
    paragraphs[1].textContent = "Tap to restart";

    tetrisGameState = false;
    tetrisPauseState = null;

    clearInterval(tetrisDropInterval);
    return;
}

// Execution

fillBackground();
createMiscGrids();

TetrisElement.addEventListener("click", () => {
    if (!tetrisGameState) {
        tetrisGameState = true;
        setTimeout(() => {
            startGame();
        }, 500)
    } 
    else if (tetrisPauseState !== null){
        pauseGame();
    }
})

const keys = document.querySelectorAll("i");
for (let i = 0; i < keys.length; i++) {
    keys[i].addEventListener("click", () => { moveBlock(i) });
}