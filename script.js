var Stackers = 
   (function() {
      var ROWS = 15;
      var COLUMNS = 7;
      var SQUARE_SIZE = 30;

      var LOADING_STATE = 0;
      var DEAD_STATE = 1;
      var PLAYING_STATE = 2;
      var WON_STATE = 3;
      var ANIMATING_STATE = 4;

      var TWO_BAR_ROW = 6;
      var ONE_BAR_ROW = 3;

      var SLOWEST_MOVING_DELAY = 150;
      var MOVING_DELAY_DECREMENT = 7;

      var BAR_COLOR = "red";

      var PAUSE_TIMEOUT = 500;
      var FLASH_TIMEOUT = 100;
      /////////////////
      var STATE = LOADING_STATE;// int
      var MOVING_DELAY;// int
      var TILES;// [[DIV]]
      var FILLED;//[[bool]]
      var BAR_POSITION; // {row:int, width:int, column:int, left:bool}
      var lastTimeout = -1;

      var setAttribute = function(elt,att,value) {
         elt.setAttribute(att, value);
         elt[att] = value;
      };

      var setClass = function(elt,value) {
         setAttribute(elt,"class",value);
         setAttribute(elt,"className",value);
      };

      var gebi = function(id) {
         return document.getElementById(id);
      };

      var setStatus = function(str) {
         var status = gebi("status");
         if (status.firstChild)
            status.removeChild(status.firstChild);
         status.appendChild(document.createTextNode(str));
      }

      ////////////////////////////////////////////

      var setStartButton = function(active) {
         var startbutton = gebi("startbutton");
         if (active) {
            startbutton.style.color = "black";
         } else {
            startbutton.style.color = "gray";
         }
      };

      var setSquareColor = function(r,c,color) {
         TILES[r][c].style.backgroundColor = color;
      };

      var displayBarRow = function(bar) {
         for (var i = 0; i < COLUMNS; i++) {
            if (i >= bar.column && i < bar.column+bar.width) {
               // bar cell
               setSquareColor(bar.row, i, BAR_COLOR);
            } else {
               // non-bar cell
               setSquareColor(bar.row, i, "white");
            }
         }
      };

      var lose = function() {
         STATE = DEAD_STATE;
         gebi("losediv").style.visibility = "visible";
         setStartButton(true);
      };

      var win = function() {
         STATE = DEAD_STATE;
         gebi("windiv").style.visibility = "visible";
         setStartButton(true);
      };

      var pauseAndMoveUp = function() {
         var called = function() {
            BAR_POSITION.row--;
            MOVING_DELAY -= MOVING_DELAY_DECREMENT;
            lastTimeout = setTimeout(moveBar, MOVING_DELAY);
         };
         lastTimeout = setTimeout(called, PAUSE_TIMEOUT);
      };

      var flashDyingCells = function(iterations, dyingCells, called) {
         return function() {
            if (iterations == 0) {
               for (var i = 0; i < dyingCells.length; i++) {
                  setSquareColor(dyingCells[i].row, dyingCells[i].column, "white");
               }
               lastTimeout = setTimeout(called, FLASH_TIMEOUT);
               return;
            } else {
               var color = (iterations%2==0) ? BAR_COLOR : "white";
               for (var i = 0; i < dyingCells.length; i++) {
                  setSquareColor(dyingCells[i].row, dyingCells[i].column, color);
               }
               lastTimeout = setTimeout(flashDyingCells(iterations-1, dyingCells, called), FLASH_TIMEOUT);
               return;
            } 
         };
      };

      var flashAndMoveUp = function() {
         // make more elaborate later
         var newwidth = 0;
         var newcolumn = -1;
         var dyingCells = [];
         for (var i = 0; i < BAR_POSITION.width; i++) {
            if (FILLED[BAR_POSITION.row+1][BAR_POSITION.column+i]) {
               newwidth++;
               if (newcolumn==-1)
                  newcolumn = BAR_POSITION.column+i;
            } else {
               dyingCells.push({row:BAR_POSITION.row, column:BAR_POSITION.column+i});
            }
         }

         var called = function() {
            BAR_POSITION.width = newwidth;
            BAR_POSITION.row--;
            if (BAR_POSITION.row == TWO_BAR_ROW)
               BAR_POSITION.width = Math.min(2,BAR_POSITION.width);
            if (BAR_POSITION.row == ONE_BAR_ROW)
               BAR_POSITION.width = Math.min(1,BAR_POSITION.width);
            MOVING_DELAY -= MOVING_DELAY_DECREMENT;
            displayBarRow(BAR_POSITION);
            lastTimeout = setTimeout(moveBar, MOVING_DELAY);
         };

         if (dyingCells.length>0) {
            lastTimeout = setTimeout(flashDyingCells(5,dyingCells,called), FLASH_TIMEOUT);
         } else {
            // no flashing
            for (var i = 0; i < BAR_POSITION.width; i++) {
               setSquareColor(BAR_POSITION.row, BAR_POSITION.column+i, BAR_COLOR);
            }
            lastTimeout = setTimeout(called, PAUSE_TIMEOUT);            
         }
      };

      var dropBar = function() {
         if (STATE != PLAYING_STATE)
            return;
         if (lastTimeout != -1)
            clearTimeout(lastTimeout);

         if (BAR_POSITION.row == ROWS-1) {
            for (var i = 0; i < BAR_POSITION.width; i++) {
               FILLED[BAR_POSITION.row][BAR_POSITION.column+i] = true;
            }
            displayBarRow(BAR_POSITION);
            pauseAndMoveUp();
            return;
         } else {
            var anyBelow = false;
            for (var i = 0; i < BAR_POSITION.width; i++) {
               if (FILLED[BAR_POSITION.row+1][BAR_POSITION.column+i]) {
                  anyBelow = true;
                  break;
               }
            }
            if (anyBelow) {
               if (BAR_POSITION.row == 0) {
                  win();
               } else {
                  for (var i = 0; i < BAR_POSITION.width; i++) {
                     if (FILLED[BAR_POSITION.row+1][BAR_POSITION.column+i]) {
                        FILLED[BAR_POSITION.row][BAR_POSITION.column+i] = true;
                     }
                  }
                  flashAndMoveUp();
               }
            } else {
               lose();
            }
            return;
         }
      };

      var moveBar = function() {
         if (STATE != PLAYING_STATE)
            return;
         
         if (BAR_POSITION.left) {
            if (BAR_POSITION.column==0) {
               BAR_POSITION.left = false;
               BAR_POSITION.column++;
            } else {
               BAR_POSITION.column--;
            }
         } else {
            if (BAR_POSITION.column+BAR_POSITION.width >= COLUMNS) {
               BAR_POSITION.left = true;
               BAR_POSITION.column--;
            } else {
               BAR_POSITION.column++;
            }
         }

         displayBarRow(BAR_POSITION);
         lastTimeout = setTimeout(moveBar, MOVING_DELAY);
      };

      var setup = function() {
         LEVEL = 0;
         MOVING_DELAY = SLOWEST_MOVING_DELAY;
         BAR_POSITION = {row:ROWS-1, column:0, width:3, left:false};
         FILLED = [];
         for (var r = 0; r < ROWS; r++) {
            var row = [];
            FILLED.push(row);
            for (var c = 0; c < COLUMNS; c++) {
               row.push(false);
               setSquareColor(r,c,"white");
            }
         }
         STATE = PLAYING_STATE;
         setStartButton(false);
         gebi("windiv").style.visibility = "hidden";
         gebi("losediv").style.visibility = "hidden";

         lastTimeout = setTimeout(moveBar, MOVING_DELAY);
      };

      var keyHandler = function(e) {
         var keynum;
         if (e.keyCode) {
            keynum = e.keyCode;
         } else if (window.event.keyCode) {
            keynum = window.event.keyCode;
            e = window.event;
         }
         
         if (keynum == 32) { // space
            if (e.preventDefault)
               e.preventDefault();
            if (e.stopPropagation)
               e.stopPropagation();

            if (STATE != PLAYING_STATE)
               return true;

            dropBar();
            return false;
         }

         return false;
      };

      var startButtonClick = function(e) {
         if (STATE == PLAYING_STATE)
            return false;
         gebi("startbutton").blur();
         setup();
      };

      var init = function(squaresdiv) {
         if (document.attachEvent) {
            document.attachEvent("onkeydown", keyHandler);
            gebi("startbutton").attachEvent("onclick", startButtonClick);
         } else if (document.addEventListener) {
            document.addEventListener("keydown", keyHandler, true);
            gebi("startbutton").addEventListener("click", startButtonClick, true);
         }

         
         var WIDTH = (COLUMNS*(SQUARE_SIZE+2));
         var HEIGHT = (ROWS*(SQUARE_SIZE+2));
         squaresdiv.style.width = WIDTH + "px";
         squaresdiv.style.height = HEIGHT + "px";
         TILES = [];
         
         for (var i = 0; i < ROWS; i++) {
            var row = [];
            TILES.push(row);
            for (var j = 0; j < COLUMNS; j++) {
               var div = document.createElement("DIV");
               setAttribute(div,"id","square_" + i + "_" + j);
               if (i==0)
                  setClass(div, "square majorprize");
               else if (i==4)
                  setClass(div, "square minorprize");
               else
                  setClass(div,"square");
               div.style.top = (i*(SQUARE_SIZE+2)) + "px";
               div.style.left = (j*(SQUARE_SIZE+2)) + "px";
               squaresdiv.appendChild(div);
               row.push(div);
            }
         }

         //setup();
      };

      var result = {
         rows : ROWS,
         columns : COLUMNS,
         init : init
      };
      return result;
   })();
