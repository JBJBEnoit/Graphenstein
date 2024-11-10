"use strict";
            class Edge {
            
                constructor (from, to, weight, id) {
                    this._from = from;
                    this._to = to;
                    this._weight = weight;
                    this._id = id;
                }
                
                get from(){
                    return this._from;
                }
                
                get to() {
                    return this._to;
                }
                
                get weight() {
                    return this._weight;
                }
                
                get id() {
                    return this._id;
                }
                
                set from(from) {
                    this._from = from;
                }
                
                set to(to) {
                    this._to = to;
                }
                
                set weight(weight) {
                    this._weight = weight;
                }
                
                toString(isWeighted) {
                    let outString = "";
                    outString += this.from + "," + this.to + ","
                    
                    if (isWeighted) {
                        outString += this.weight + "/";
                    } else {
                        outString += "0/";
                    }    
                    return outString;
                }
            }
            
            class Node {
                constructor(x=0, y=0, radius=30, name, data, parents = new Map()){
                    this._x = x;
                    this._y = y;
                    this._radius = radius;
                    this._name = name;
                    this._data = data;
                    this._parents = parents;
                }
                
                get x(){return this._x;}
                get y(){return this._y;}
                get radius(){return this._radius;}
                get name(){return this._name;}
                get data(){return this._data;}
                get parents(){return this._parents};
                
                set x(x){this._x = x;}
                set y(y){this._y = y;}
                set radius(r){this._radius = r;}
                set data(d){this._data = d}
                set parents(m){this._parents = m;}
            }

            class Algo {
                constructor(id, name, graphType, str, func, animate){
                    this._id = id;
                    this._name = name;
                    this._graphType = graphType;
                    this._str = str;
                    this._func = func;
                    this._animate = animate;
                }
                    
                    get id(){return this._id;}
                    get name(){return this._name;}
                    get graphType(){return this._graphType;}
                    get str(){return this._str;}
                    get func(){return this._func;}
                    get animate(){return this._animate;}
                    
                    set id(id){this._id = id;}
                    set name(name){this._name = name;}
                    set graphType(graphType){this._graphType = graphType;}
                    set str(str){this._str = str;}
                    set func(func){this._func = func;}
                    set animate(anim){this._animate = anim;}
                
            }

            window.onload = ()=>{
                
                var globalEdgeIdNum = 1;//Increments each time a new edge is created, used to make unique (might not need this)
                var isDirected = false;
                var isWeighted = false;
                var numNodes = 0;

                var edgeMap = new Map();
                var nodeMap = new Map();
                var $gel = (el) => { return document.getElementById(el); };
                //var curGraph;
                var graphDrawn = false;
                var nodePositions = new Map();
                var zoom;
                var cy;
                var canvas = $gel("cnv");
                var nodesUpdated = false;
                var ctxScale = 1;
                var canvDim = 1000;
                
                canvas.style.backgroundColor = "#faeeb9";
                
                
                
                const curGraph = function(){
                    let edgeStr = "";
                    let curG;
                    
                    for (let [key, value] of edgeMap) {
                        edgeStr += value.toString(isWeighted);
                    }

                    if (isDirected) {
                        curG = new Module.Digraph(edgeStr, numNodes);
                    } else {
                        curG = new Module.UndirectedGraph(edgeStr, numNodes);
                    } 
                    
                    return curG;
                };
                
                // Get random color gradients for nodes
                function randomGradientStops(brightness){
                    function randomChannel(brightness){
                        var r = 255-brightness;
                        var n = 0|((Math.random() * r) + brightness);
                        var s = n.toString(16);
                        var lightN = (n + 125) < 255 ? n + 125 : 255;
                        var lightS = lightN.toString(16);
                        var res = [];
                        res.push(lightS.length == 1 ? '0' + lightS : lightS);
                        res.push((s.length==1) ? '0'+s : s);
                        return res;
                    }
                    let red = randomChannel(brightness);
                    let green = randomChannel(brightness);
                    let blue = randomChannel(brightness);
                    let grdStops = [];
                    grdStops.push("#" + red[0] + green[0] + blue[0]);
                    grdStops.push("#" + red[1] + green[1] + blue[1]);
                    return grdStops;
                }
                    
                
                //#algoMap
                var algoMap = new Map();
                var fillAlgoMap = function(){
                    
                    // Show animate button
                    function showAnimBtn(animFunc){
                        $gel("animBtnDiv").innerHTML = "<button id='animPlayBtn' class='btnActive'>\u25b6 Animate Solution</button>";
                        $gel("animPlayBtn").addEventListener("click", animFunc);
                    }
                    
                    // Create algo objects in algoMap
                    // Shortest path betwen two vertices
                    algoMap.set(1, new Algo(1, "Shortest Path Between Two Vertices (Dijkstra)", "both", function(){ 
                        let shortPStr = "Shortest Path<br /><br /><label for='shortPathFrom'>From: </label>";
                        shortPStr += "<select id='shortPathFrom' class='drpDwn'>";
                        for (let i = 0; i < numNodes; ++i) {
                            shortPStr += "<option class='drpDwn' value='" + i + "'>" + (i + 1) + "</option>";
                        }
                        shortPStr += "</select>";
                        shortPStr += "<label for='shortPathTo'> To: </label>";
                        shortPStr += "<select id='shortPathTo' class='drpDwn'>";
                        for (let i = 0; i < numNodes; ++i) {
                            shortPStr += "<option class='drpDwn' value='" + i + "'>" + (i + 1) + "</option>";
                        }
                        shortPStr += "</select>";
                        return shortPStr;
                    }, function(graph){
                        let shrtFrom = parseInt($gel("shortPathFrom").value);
                        let shrtTo = parseInt($gel("shortPathTo").value);
                        let path = new Module.IntVector();
                        let display = $gel("algoResults");
                        path = graph().find_shortest_path(shrtFrom, shrtTo);
                        let pLast = path.size() - 1;
                        display.innerHTML = ""; // clear the display
                        if (path.get(0) === -1) {
                            display.innerHTML = "No path possible";
                        } else if (path.get(0) === -2){
                            display.innerHTML = "Graph contains negative edge weight -- ";
                            if (isDirected){
                                display.innerHTML += "use Bellman-Ford algorithm instead";
                            } else {
                                display.innerHTML += "can not find shortest path";
                            }    
                        } else{
                            display.innerHTML = "<div style='text-align:center; margin-top: 1rem;'>Shortest Path Found:</div>";
                            for (let i = 0; i < path.size() - 1; ++i) {
                                    display.innerHTML += "" + (path.get(i) + 1) + "\u2b62";                             
                            }
                            display.innerHTML += "" + (path.get(pLast) + 1);
                            var animFunc = ()=>{return this.animate(0, path);};
                            showAnimBtn(animFunc);                       
                        } 

                    }, function animateAlgo(idx, pathVec) {

                        if (idx >= pathVec.size()){
                            return;
                        }

                        let ctx = canvas.getContext('2d');
                        let nodeId = pathVec.get(idx) + 1;
                        let node = nodeMap.get(nodeId);
                        drawNode(nodeId, false, ctx, ["lightpink", "red"], 31);
                        setTimeout(function(){redrawGraph();}, 1000);           
                        setTimeout(function(){animateAlgo(idx + 1, pathVec);}, 1000);
                    }));

                    // Connected components algo (undirected graph)
                    algoMap.set(2, new Algo(2, "Connected Components", "undirected", function(){return "This algorithm uses Depth First Search to identify connected components";}, function getConnectedComponents(graph){
                        let components = new Module.IntIntVectorMap();
                        let display = $gel("algoResults");
                        components = graph().connected_components();
                        display.innerHTML = "";

                        //Some kind of Emscripten weirdness with a keys() function to iterate through the map...
                        let mapKeys = components.keys();

                        if (mapKeys.size() === 1){
                            display.innerHTML = "There is 1 connected component containing all vertices";
                            return;
                        }

                        for (let i = 0; i < mapKeys.size(); ++i){
                            let key = mapKeys.get(i);
                            let val = components.get(key);               
                            display.innerHTML += "Component " + (key + 1) + ": <br />";
                            for (let j = 0; j < val.size(); ++j){
                                display.innerHTML += (val.get(j) + 1) + (j < val.size() - 1 ? ", " : "");
                                display.innerHTML += "<br /><br />"; 
                            }

                            let animFunc = ()=>{return this.animate(components, mapKeys);};
                            showAnimBtn(animFunc);
                        }               
                    }, function animateAlgo(components, mapKeys){                               
                        // Assign random color to each connected component and color nodes accordingly
                        let ctx = canvas.getContext("2d");
                        for (let i = 0; i < mapKeys.size(); ++i){
                            let key = mapKeys.get(i);
                            let component = components.get(key);
                            let componentColor = randomGradientStops(5);
                            for (let j = 0; j < component.size(); ++j){
                                let nodeId = component.get(j) + 1;
                                let node = nodeMap.get(nodeId);
                                drawNode(nodeId, false, ctx, componentColor, 31);
                            }
                        }
                    }));

                    // Detect if graph contains at least 1 cycle using DFS
                    algoMap.set(3, new Algo(3, "Contains Cycle", "both", function(){return "This algorithm uses Depth First Search to determine if the graph contains at least one cycle";}, function runAlgo(graph){
                        let hasCycle = !graph().is_acyclic();
                        let display = $gel("algoResults");
                        display.innerHTML = "";
                        display.innerHTML = "Graph" + (hasCycle ? " contains " : " does not contain ") + "cycle";
                    }));

                    // Tarjan's Algorithm for finding strongly connected components
                    algoMap.set(4, new Algo(4, "Strongly Connected Components (Tarjan)", "directed", function(){return "Tarjan's Algorithm for finding strongly connected components in a directed graph";}, function runAlgo(graph){
                        let components = graph().tarjans_strongly_connected_components();
                        let display = $gel("algoResults");
                        display.innerHTML = "";
                        for (let i = 0; i < components.size(); ++i) {
                            display.innerHTML += "Strongly Connected Component " + (i + 1) + ":<br />";
                            let component = components.get(i);
                            for (let j = 0; j < component.size(); ++j) {
                                display.innerHTML += (component.get(j) + 1) + (j < component.size() - 1 ? ", " : "<br /><br />");
                            }
                        }
                        let animFunc = ()=>{return this.animate(components);};
                        showAnimBtn(animFunc);                   
                    }, function animateAlgo(components){                   
                        let ctx = canvas.getContext("2d");
                        for (let i = 0; i < components.size(); ++i){
                            let component = components.get(i);
                            let componentColor = randomGradientStops(5);
                            for (let j = 0; j < component.size(); ++j){
                                let nodeId = component.get(j) + 1;
                                let node = nodeMap.get(nodeId);
                                drawNode(nodeId, false, ctx, componentColor);
                            }    
                        }
                    }));

                    algoMap.set(5, new Algo(5, "Topological Sort", "directed", function(){return "Gives an ordering of vertices in which child vertices are always preceded by parent vertices";}, function runAlgo(graph){
                        let ordering = graph().topsort();
                        let display = $gel("algoResults");
                        display.innerHTML = "";
                        if (ordering.size() === 0){
                            display.innerHTML = "Graph contains a cycle - topological sort is not possible<br />";
                            return;
                        }
                        for (let i = 0; i < ordering.size(); ++i){
                            display.innerHTML += (ordering.get(i) + 1) + (i < ordering.size() - 1 ? ", " : "<br />");
                        }
                        
                        let animFunc = ()=>{return this.animate(0, ordering);};
                        showAnimBtn(animFunc);
                    }, function animateAlgo(idx, ordering){
                        if (idx >= ordering.size()){
                            return;
                        }
                        
                        let ctx = canvas.getContext('2d');
                        let nodeId = ordering.get(idx) + 1;
                        let node = nodeMap.get(nodeId);
                        drawNode(nodeId, false, ctx, ["lightpink", "red"]);
                        setTimeout(function(){redrawGraph();}, 1000);           
                        setTimeout(function(){animateAlgo(idx + 1, ordering);}, 1000);
                        
                    }));
                    
                    algoMap.set(5, new Algo(5, "Minimum Spanning Forest (Kruskal)", "undirected", function(){return "Gives the minimum length spanning tree / forest";}, function(graph){
                        let minTree = graph().kruskal();
                        let display = $gel("algoResults");
                        
                        if (minTree.size() == 0){
                            display.innerHTML = "Graph has no edges. Spanning forest does not exist."
                            return;
                        }
                        display.innerHTML = "";
                        let totalDist = 0;
                        let treeEdges = [];
                        display.innerHTML += "Minimum Spanning Tree / Forest:<br/ ><br />";
                        for (let i = 0; i < minTree.size(); ++i){
                            let edgeArr = minTree.get(i);
                            let start = edgeArr.get(0);
                            let end = edgeArr.get(1);
                            let weight = edgeArr.get(2);
                            let curEdge = new Edge(start, end, weight);
                            totalDist += weight;
                            treeEdges.push(curEdge);
                            display.innerHTML += (start + 1) + "\u2b62" + (end + 1) + " Weight: " + weight + " Total Weight: " + totalDist + "<br />";
                        }
                        let animFunc = ()=>{return this.animate(treeEdges);};
                        showAnimBtn(animFunc);    
                    }, function(treeEdges){
                        let ctx = canvas.getContext("2d");
                        for (let curEdge of treeEdges){
                            drawEdge(curEdge, false, ctx, "red");
                        }
                    }));
                    
                    algoMap.set(6, new Algo(6, "Minimum Spanning Tree (Prim)", "undirected", function(){return "Gives the minimum length spanning tree for a connected graph";}, function(graph){
                    
                        let display = $gel("algoResults");
                        display.innerHTML = "";
                        let numComponents = graph().connected_components().size();
                        if (numComponents > 1){
                            display.innerHTML = "Prim's algorithm does not work on disconnected graphs.";
                            return;
                        } 
                        
                        let minTree = graph().prim();
                        let totalDist = 0;
                        let treeEdges = [];
                        display.innerHTML += "Minimum Spanning Tree:<br/ ><br />";
                        for (let i = 0; i < minTree.size(); ++i){
                            let edgeArr = minTree.get(i);
                            let start = edgeArr.get(0);
                            let end = edgeArr.get(1);
                            let weight = edgeArr.get(2);
                            let curEdge = new Edge(start, end, weight);
                            totalDist += weight;
                            treeEdges.push(curEdge);
                            display.innerHTML += (start + 1) + "\u2b62" + (end + 1) + " Weight: " + weight + " Total Weight: " + totalDist + "<br />";
                        }
                        let animFunc = ()=>{return this.animate(treeEdges);};
                        showAnimBtn(animFunc);    
                    }, function(treeEdges){
                        let ctx = canvas.getContext("2d");
                        for (let curEdge of treeEdges){
                            drawEdge(curEdge, false, ctx, "red");
                        }
                    }));
                    
                    algoMap.set(7, new Algo(7, "Shortest Path / Detect Negative Cycle (Bellman-Ford)", "directed", function(){
                        let str = "Finds shortest path from a single source vertex to all others. Can handle negative edge weights, and detects if negative cycle exists in graph<br />";
                        str += "<label for='bellmanFordFrom'>From: </label>";
                        str += "<select id='bellmanFordFrom' class='drpDwn'>";
                        for (let i = 0; i < numNodes; ++i) {
                            str += "<option class='drpDwn' value='" + i + "'>" + (i + 1) + "</option>";
                        }
                        str += "</select>";
                        str += "<label for='bellmanFordTo'> To: </label>";
                        str += "<select id='bellmanFordTo' class='drpDwn'>";
                        for (let i = 0; i < numNodes; ++i) {
                            str += "<option class='drpDwn' value='" + i + "'>" + (i + 1) + "</option>";
                        } 
                        str += "</select>";
                        return str;}, function(graph){
                        let start = parseInt($gel("bellmanFordFrom").value);
                        let end = parseInt($gel("bellmanFordTo").value);
                        let prev = graph().bellman_ford(start);
                        let display = $gel("algoResults");
                        
                        if (prev.get(0) === -2){
                            display.innerHTML = "Graph contains negative cycle -- cannot find shortest path";
                            return;
                        }
                        
                        if (prev.get(end) === -1){
                            display.innerHTML = "No path possible";
                            return;
                        }
                        
                        // Need to backtrack through prev vector to find path
                        let idx = end;
                        let path = [];
                        path.push(end);
                        
                        while (idx !== start && idx >= 0){
                            let tmp = prev.get(idx);                        
                            path.push(tmp);
                            idx = tmp;
                        }                      

                        display.innerHTML = "Shortest Path:<br />";
                        for (let i = path.length - 1; i > 0; --i){
                            display.innerHTML += (path[i] + 1) + "\u2b62";
                        }
                        display.innerHTML += (path[0] + 1);
                        let animIdx = path.length - 1;
                        let animFunc = ()=>{return this.animate(animIdx, path)};
                        showAnimBtn(animFunc);      
                    }, function animateAlgo(idx, pathVec){
                        if (idx < 0){
                            return;
                        }

                        let ctx = canvas.getContext('2d');
                        let nodeId = pathVec[idx] + 1;                   
                        let node = nodeMap.get(nodeId);
                        drawNode(nodeId, false, ctx, ["lightpink", "red"], 31);
                        setTimeout(function(){redrawGraph();}, 1000);           
                        setTimeout(function(){animateAlgo(idx - 1, pathVec);}, 1000);
                    }));
                    
                    algoMap.set(8, new Algo(8, "Eulerian Cycle / Path (Hierholzer)", "both", function(){ return "<div style='text-align:left'>Finds, if possible, a path through the graph traversing each edge only once</div>";}, function(graph){
                        let path = graph().hierholzer();
                        let display = $gel("algoResults");
                        
                        if (path.size() === 0){
                            
                            display.innerHTML = "Eulerian Path / Cycle does not exist";
                            return;
                        }
                        
                        for (let i = 0; i < path.size() - 1; ++i){
                            
                            display.innerHTML += (path.get(i) + 1) + "\u2b62";
                        }
                        display.innerHTML += (path.get(path.size() - 1) + 1);
                        
                        let animFunc = ()=>{return this.animate(0, path);};
                        showAnimBtn(animFunc);
                    }, function animateAlgo(idx, pathVec){
                        if (idx >= pathVec.size()){
                            return;
                        }

                        let ctx = canvas.getContext('2d');
                        let nodeId = pathVec.get(idx) + 1;
                        let node = nodeMap.get(nodeId);
                        drawNode(nodeId, false, ctx, ["lightpink", "red"], 31);
                        setTimeout(function(){redrawGraph();}, 1000);           
                        setTimeout(function(){animateAlgo(idx + 1, pathVec);}, 1000);
                        
                    }));
                    
                    algoMap.set(9, new Algo(9, "Max Flow (Push-Relabel)", "both", ()=>{ 
                        let str = "<div style='text-align:left'>Finds the maximum flow, using edge weights as flow capacities, given a starting node (source) and an ending node (sink).</div><br />";
                        str += "<label for='maxFlowFrom'> Source: </label>";
                        str += "<select id='maxFlowFrom' class='drpDwn'>";
                        for (let i = 0; i < numNodes; ++i) {
                            str += "<option class='drpDwn' value='" + i + "'>" + (i + 1) + "</option>";
                        }
                        str += "</select>";
                        str += "<label for='maxFlowTo'> Sink: </label>";
                        str += "<select id='maxFlowTo' class='drpDwn'>";
                        for (let i = 0; i < numNodes; ++i) {
                            str += "<option class='drpDwn' value='" + i + "'>" + (i + 1) + "</option>";
                        }
                        str += "</select>";
                        return str; 
                    }, function(graph){
                        let source = parseInt($gel("maxFlowFrom").value);
                        let sink = parseInt($gel("maxFlowTo").value);
                        let maxFlow = graph().push_relabel_max_flow(source, sink);
                        let display = $gel("algoResults");
                        display.innerHTML = "Maximum flow is " + maxFlow;
                    }))
                }();
                             
                // Populate algo dropdown
                var populateAlgoDrpdwn = function(){
                    let algoSel = $gel("algoSel");
                    algoSel.innerHTML = "";
                    algoSel.innerHTML += "<option class='drpDwn' value='0' disabled selected>Select Alogrithm</option>";
                    for (let [key, val] of algoMap){
                    
                        let gType = val.graphType;
                        if (gType === "both" || (gType === "directed" && isDirected) || (gType === "undirected" && !isDirected)){
                            algoSel.innerHTML += "<option class='drpDwn' value='" + key + "'>" + val.name + "</option>";
                        }
                    }
                    $gel("algoIn").innerHTML = "";
                    $gel("algoResults").innerHTML = "";
                    $gel("animBtnDiv").innerHTML = "";
                };
                               
                // display currently selected algo interface
                function displaySelectedAlgoUI(){
                    let key = parseInt($gel("algoSel").value);
                    if (key){
                       let curAlgo = algoMap.get(key);
                        $gel("algoIn").innerHTML = curAlgo.str() + "<br />" + "<button id='runAlgo' class='btnActive'>Run " + curAlgo.name + "</button>";
                        $gel("runAlgo").addEventListener("click", ()=>{curAlgo.func(curGraph);});
                        $gel("algoResults").innerHTML = "";
                        $gel("animBtnDiv").innerHTML = "";
                    } 
                }
                
                algoSel.addEventListener("change", ()=>{displaySelectedAlgoUI(); redrawGraph();});
                
                
                
                // The following is an adaptation of code courtesy of riptutorial.com
                // for dragging objects on canvas
                // calculates offset of canvas relative to window
                var isDragging=false;
                var isDraggingShape=false;
                var startX,startY;
                var cDiv = $gel("canvDiv");
                var cTop = cDiv.scrollTop;
                var cLeft = cDiv.scrollLeft;
                var reOffset = function(){ return ()=>{
                    var BB=canvas.getBoundingClientRect();
                    offsetX=BB.left;
                    offsetY=BB.top;        
                };}();
                var offsetX,offsetY;
                reOffset();
                // listen for mouse events
                canvas.onmousedown=handleMouseDown;
                canvas.ontouchstart=handleMouseDown;
                canvas.onmousemove=handleMouseMove;
                canvas.ontouchmove=handleMouseMove;
                canvas.onmouseup=handleMouseUp;
                canvas.ontouchend=handleMouseUp;
                canvas.onmouseout=handleMouseOut;
                
                // For scrolling parent div to canvas
                $gel("canvDiv").onscroll=function(e){ reOffset(); }             
                
                window.onscroll=function(e){ reOffset(); }
                window.onresize=function(e){ reOffset(); }
                canvas.onresize=function(e){ reOffset(); }
                
                var selectedNodeIndex; // to hold id of selected node
                
                // given mouse X & Y (mx & my) and shape object
                // return true/false whether mouse is inside the shape
                function isMouseInShape(mx,my,shape){
                    if(shape.radius){
                        // this is a circle
                        var dx=mx-shape.x * ctxScale;
                        var dy=my-shape.y * ctxScale;
                        // math test to see if mouse is inside circle
                        if(dx*dx+dy*dy <shape.radius * ctxScale * shape.radius * ctxScale){
                            // yes, mouse is inside this circle
                            
                            
                            
                            return(true);
                        }
                    }   else if(shape.width)    {
                        // this is a rectangle
                        var rLeft=shape.x;
                        var rRight=shape.x+shape.width;
                        var rTop=shape.y;
                        var rBott=shape.y+shape.height;
                        // math test to see if mouse is inside rectangle
                        if( mx>rLeft && mx<rRight && my>rTop && my<rBott){
                            return(true);
                        }
                    }
                    // the mouse isn't in any of the shapes
                    return(false);
                }

                function handleMouseDown(e){
                    // tell the browser we're handling this event
                    e.preventDefault();
                    e.stopPropagation();
                    
                    $gel("canvDiv").style.cursor = "grabbing";

                    // calculate the current mouse position
                    startX=parseInt(e.clientX-offsetX);
                    startY=parseInt(e.clientY-offsetY);
                    
                    // test mouse position against all shapes
                    // post result if mouse is in a shape
                    for(let [key,val] of nodeMap){
                        if(isMouseInShape(startX,startY,val)){
                            // the mouse is inside this shape
                            // select this shape
                            selectedNodeIndex=key;
                            // set the isDragging flag
                            isDragging=true;
                            isDraggingShape=true;
                            // and return (==stop looking for 
                            //     further shapes under the mouse)
                            return;
                        }
                        isDragging = true;
                    }
                }

                function handleMouseUp(e){
                    
                    $gel("canvDiv").style.cursor = "grab";
                    // return if we're not dragging
                    if(!isDragging){return;}
                    // tell the browser we're handling this event
                    e.preventDefault();
                    e.stopPropagation();
                    // the drag is over -- clear the isDragging flag
                    isDragging=false;
                    isDraggingShape=false;
                }

                function handleMouseOut(e){
                    // return if we're not dragging
                    if(!isDragging){return;}
                    // tell the browser we're handling this event
                    e.preventDefault();
                    e.stopPropagation();
                    // the drag is over -- clear the isDragging flag
                    isDragging=false;
                    isDraggingShape=false;
                }

                function handleMouseMove(e){
                    // return if we're not dragging
                    if(!isDragging){return;}
                    // tell the browser we're handling this event
                    e.preventDefault();
                    e.stopPropagation();
                    // calculate the current mouse position         
                    var mouseX=parseInt(e.clientX-offsetX);
                    var mouseY=parseInt(e.clientY-offsetY);
                    // how far has the mouse dragged from its previous mousemove position?
                    var dx=mouseX-startX;
                    var dy=mouseY-startY;
                    
                    if (isDraggingShape){
                       // move the selected shape by the drag distance
                        var selectedShape=nodeMap.get(selectedNodeIndex);
                        selectedShape.x +=dx / ctxScale;
                        selectedShape.y +=dy / ctxScale;
                        redrawGraph();
                        // update the starting drag position (== the current mouse position)
                        startX=mouseX;
                        startY=mouseY; 

                    } else {
                        let cDiv = $gel("canvDiv");
                        let cDivH = cDiv.offsetHeight;
                        let cDivW = cDiv.offsetWidth;
                        if (cLeft - dx + cDivW < canvas.width * ctxScale){
                            cDiv.scrollLeft = cLeft - dx;
                            cLeft = cDiv.scrollLeft;
                        }
                        
                        if (cTop - dy + cDivH < canvas.height * ctxScale){
                            cDiv.scrollTop = cTop - dy; 
                            cTop = cDiv.scrollTop;
                        }  
                    }   
                }
                // end of riptutorial-inspired code
                
                

                function updateNumNodes() {
                    
                    
                    let newNumNodes = parseInt($gel("numNodesTxt").value);
                    newNumNodes = isNaN(newNumNodes) ? 0 : newNumNodes;
                    newNumNodes = newNumNodes < 0 ? 0 : newNumNodes;
                    newNumNodes = newNumNodes > 5000 ? 5000 : newNumNodes;
                    // If replacing a previous value
                    //if (numNodes > 0) {
                    if (numNodes > 0) {
                        $gel("edgeUI").innerHTML = "";

                        // If new number of vertices is less than previous, remove edges that span vertices with id's greater than allowed
                        // TODO display option message about possible data loss when reducing number of vertices
                        //if (newNumNodes < numNodes) {
                        if (newNumNodes < numNodes) {
                            let oversize = [];
                            for (let [key, value] of edgeMap) {
                                if (value.from >= newNumNodes || value.to >= newNumNodes) {
                                    oversize.push(key);
                                }
                            }
                            
                            for (let i = newNumNodes + 1; i <= numNodes; ++i){
                                nodeMap.delete(i);
                            }
                            
                            
                            for (let i of oversize) {
                                
                                // need to delete edges from parent lists
                                let curEdge = edgeMap.get(i);
                                for (let [key, val] of nodeMap){
                                    if (val.parents.get(curEdge.from + 1) && val.parents.get(curEdge.from + 1).has(curEdge)){
                                        val.parents.get(curEdge.from + 1).delete(curEdge);
                                    }
                                }
                                
                                edgeMap.delete(i);
                            }
                        }
                        
                        // Rebuild edge input fields
                        numNodes = newNumNodes;
                        for (let [key, value] of edgeMap) {
                            addEdge(key);
                        }
                        updateEdgeInputs();

                    } 
                    
                    numNodes = newNumNodes;
                    $gel("numNodesTxt").value = numNodes; 
                    nodesUpdated = true;
                    buildGraph();
                    populateAlgoDrpdwn();
                    
                }

                function updateDirected() {
                    isDirected = document.getElementById("isDirected").checked;

                    if (graphDrawn){
                        redrawGraph();  
                    }

                    buildGraph();
                    populateAlgoDrpdwn();
                }

                function addEdge(edgeIdNum) {

                    if (numNodes === 0){
                        return;
                    }
 
                    let isNew = false;
                    if (edgeIdNum === undefined) {
                        edgeIdNum = globalEdgeIdNum++;
                        edgeMap.set(edgeIdNum, new Edge(0,0,0, edgeIdNum));
                        isNew = true; 
                    }

                    let edgeStr = "<div id ='edge" + edgeIdNum +"'>";
                    edgeStr += "<label for='from" + edgeIdNum + "' class='drpDwnEdgeLbl'>From: </label>";
                    edgeStr += "<select id='from" + edgeIdNum + "' class='drpDwn'>";
                    for (let i = 0; i < numNodes; ++i) {
                        edgeStr += "<option class='drpDwn' value='" + i + "'>" + (i + 1) + "</option>";
                    }
                    edgeStr += "</select>";
                    edgeStr += "<label for='to" + edgeIdNum + "' class='drpDwnEdgeLbl'>To: </label>";
                    edgeStr += "<select id='to" + edgeIdNum + "' class='drpDwn'>";
                    for (let i = 0; i < numNodes; ++i) {
                        edgeStr += "<option class='drpDwn' value='" + i + "'>" + (i + 1) + "</option>";
                    }
                    edgeStr += "</select>";
                    edgeStr += "<label for='weight" + edgeIdNum + "' class='drpDwnEdgeLbl'>Weight: </label>";
                    edgeStr += "<input type='text' id='weight" + edgeIdNum +"' class='weightTxt' size='1' onfocus='this.setSelectionRange(0, this.value.length)'></input>";
                    edgeStr += "<button id='remBtn" + edgeIdNum +"' class='delEdgeBtn'>X</button>";
                    edgeStr += "</div>";
                    let edgeUI = $gel("edgeUI");
                    edgeUI.insertAdjacentHTML("beforeend", edgeStr);

                    if (isNew) {
                        updateEdgeInputs(edgeIdNum);
                        edgeUI.scrollTop = edgeUI.scrollHeight;
                    }
                    
                    populateAlgoDrpdwn();
                }

                function updateWeighted() {
                    isWeighted = $gel("isWeighted").checked;
                    updateEdgeInputs();
                    redrawGraph();
                    populateAlgoDrpdwn();
                }
                
                function updateScale(){
                     
                    ctxScale = 1 / ctxScale;
                    let ctx = canvas.getContext("2d");
                    ctx.scale(ctxScale, ctxScale); // bring to 100%;
                    reOffset();
                    let inpt = $gel("scaleInpt").value;
                    inpt = inpt === undefined || inpt <= 1 ? 2 : inpt;
                    inpt = inpt > 200 ? 200 : inpt;
                    ctxScale = inpt / 100;
                    ctx.scale(ctxScale, ctxScale);
                    
                    if (graphDrawn){
                        redrawGraph();
                        return;
                    }
                    drawGraph();
                }
                
                

                function updateEdgeInputs(edgeIdNum) {
                    
                    function setEdgeInput(key, value){
                        let curFrom = $gel("from" + key);
                        curFrom.value = value.from;


                        let curTo = $gel("to" + key);
                        curTo.value = value.to;


                        let curWeight = $gel("weight" + key);
                        curWeight.value = value.weight;


                        if (!isWeighted) {
                            curWeight.disabled = true;
                        } else {
                            curWeight.disabled = false;
                        }

                        let curBtn = $gel("remBtn" + key);

                        curFrom.addEventListener("change", ()=>{updateEdge(key);});
                        curTo.addEventListener("change", ()=>{updateEdge(key);});
                        curWeight.addEventListener("keyup", ()=>{updateEdge(key);});
                        curBtn.addEventListener("click", ()=>{removeEdge(key);});
                    }
                    
                    if (edgeIdNum !== undefined){
                        let val = edgeMap.get(edgeIdNum);
                        setEdgeInput(edgeIdNum, val);
                        return;
                    }
                    
                   for (let [key, value] of edgeMap) {
                        setEdgeInput(key, value);
                    }  
                }

                function updateEdge(id) {
                    let curEdge = edgeMap.get(id);
                    var oldTo = curEdge.to;
                    var oldFrom = curEdge.from;
                    curEdge.from = parseInt($gel("from" + id).value);
                    curEdge.to = parseInt($gel("to" + id).value);
                    
                    // Remove from parents of node this edge used to point to
                    if (oldTo !== undefined && (oldTo !== curEdge.to || oldFrom !== curEdge.from)){
                        var oldToParents = nodeMap.get(oldTo + 1).parents;
                        
                        if (oldToParents.get(oldFrom + 1)){
                            oldToParents.get(oldFrom + 1).delete(curEdge);
                            
                            if (oldToParents.get(oldFrom + 1).size === 0){
                                oldToParents.delete(oldFrom + 1);
                            }
                        } 
                    }
                    
                    // Tracking the parents needs to also track the edgeId 
                    var toNodeParents = nodeMap.get(curEdge.to + 1).parents;
                    if (toNodeParents.has(curEdge.from + 1)){
                        toNodeParents.set(curEdge.from + 1, toNodeParents.get(curEdge.from + 1).add(curEdge));                    
                    }   else if (curEdge.from !== curEdge.to)    { // self-joined nodes are handled differently
                        toNodeParents.set(curEdge.from + 1, new Set().add(curEdge));
                    }
                    let curWeight = parseFloat($gel("weight" + id).value);
                    curEdge.weight = isNaN(curWeight) ? 0 : curWeight;
                    if (graphDrawn){
                        redrawGraph();
                    }
                    displaySelectedAlgoUI();
                }

                function removeEdge(id) {                  
                    for (let [key, value] of nodeMap){                     
                        for (let [key1, val1] of value.parents){
                            
                            val1.delete(edgeMap.get(id));
                            
                            if (val1.size === 0){
                                value.parents.delete(val1);
                            }
                        }
                    }
                    
                    edgeMap.delete(id);
                    let edgeUI = $gel("edgeUI");
                    $gel("edge" + id).remove();

                    if (graphDrawn){
                        redrawGraph();
                    }
                    
                    populateAlgoDrpdwn();
                }

                function buildGraph() {
                    if (graphDrawn && !nodesUpdated){
                        redrawGraph();
                    } else {
                        drawGraph();
                    }
                    
                   nodesUpdated = false;  
               }
                
                // For use with cytoscape
                function savePos(){

                    if (cy === undefined){
                        return;
                    }
                    for (let i = 1; i <= numNodes(); ++i){

                        let nodeId = '#node' + i;
                        let pos = cy.$(nodeId).position();
                        nodePositions.set(i, pos);
                    }
                }

                // For using cytoscape to render graph
//                function drawGraphCyto(){
//                    cy = cytoscape({
//                        container: $gel('cy'), 
//                        style: [{
//                            selector: 'node', 
//                            style: {'background-color': 'green', label: 'data(id)'}},
//
//                                        {
//                                            selector: 'edge',
//                                            style: {
//                                                label: isWeighted ? 'data(weight)' : '',
//                                                'width': 3,
//                                                'line-color': '#ccc',
//                                                'target-arrow-color': '#ccc',
//                                                'target-arrow-shape': isDirected ? 'triangle' : 'none',
//                                                'curve-style': 'bezier'
//                                            }
//                                        }]});
//
//                    for (let i = 1; i <= numNodes; ++i){
//                        cy.add({
//                            data: {id: 'node' + i}
//                        });
//                    }
//
//                    for (let [key,value] of edgeMap){
//                        let source = 'node' + (value.from + 1);
//                        let dest = 'node' + (value.to + 1);
//                        let edgeWeight = value.weight;
//                        cy.add({
//                            data: {
//                                id: 'edge' + (key + 1),
//                                source: source,
//                                target: dest,
//                                weight: edgeWeight
//                            }
//                        });
//                    }
//
//
//                    if (!graphDrawn){
//                        var layout = cy.layout({name: 'grid'});
//                        layout.run();  
//                        cy.fit();
//                    } else {
//                        for (let i = 1; i <= numNodes; ++i){
//                            cy.$('#node' + i).position(nodePositions.get(i)); 
//                        }
//                    }
//
//                    savePos();
//                    graphDrawn = true;
//                }

                function drawGraph(){

                    let ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    
                    //DEBUG
//                    {
//                        
//                        
//                        ctx.arc(100, 75, 50, 0, 2 * Math.PI);
//                        ctx.fillStyle = "red";
//                        ctx.fill();
//                    }
                    // end debug
                    
                    
                    let x = 70;
                    let y = 70;
                    let cols = Math.ceil(Math.sqrt(numNodes));
                    let row = cols;
                    let displayWidth = $gel("canvDiv").offsetWidth - 15;
                    let spacing = Math.max(displayWidth / cols, 90);

                    for (let i = 0; i < numNodes; ++i){
                        
                        if (i > 0 && i % cols == 0){
                            x = 70;
                            y += 90;  
                        }
                        

                        //add to nodeMap
                        let parents;
                        if (nodeMap.has(i + 1)){
                            parents = nodeMap.get(i + 1).parents;  
                        }
                        nodeMap.set(i + 1, new Node(x, y, 30, i + 1, undefined, parents));
                        
                                               
                        // node drop shadows
                        drawNode(i + 1, true, ctx);

                        x += spacing;   
                    }
                    
                    // Edge shadows
                    for (let [key, val] of edgeMap){
                        
                        drawEdge(val, true, ctx);
                    }
                    
                    // Egdes
                    for (let [key, val] of edgeMap){
                        drawEdge(val, false, ctx);
                    }
                    
                    // Nodes
                    for (let [key, val] of nodeMap){
                        drawNode(key, false, ctx);
                            
                    }
                    
                    graphDrawn = true;
                    reOffset();
                    
                }
                
                function redrawGraph(){
                    let ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    
                    //node drop shadows
                    for (let [key, val] of nodeMap){
                        
                        drawNode(key, true, ctx);
                        
                    }
                    
                     //edge drop shadow
                    for (let [key, val] of edgeMap){
                        drawEdge(val, true, ctx);
                    }
                    
                    // Edges
                    for (let [key, val] of edgeMap){
                        
                        drawEdge(val, false, ctx);
                    
                    }
                    
                    // Nodes
                    for (let [key, value] of nodeMap){
                        
                        drawNode(key, false, ctx);
                    }
                    
                    reOffset();
                }
                
                function drawNode(id, isShadow, ctx, color = ["lightblue", "blue"], radius = 30){
                    
                    ctx.beginPath();
                    
                    var shdwOffsetX = isShadow ? 7 : 0;
                    var shdwOffsetY = isShadow ? 9 : 0;
                    var shdwOffsetRad = isShadow ? -2 : 0;
                    var node = nodeMap.get(id);
                    var radius = radius === undefined ? node.radius : radius;
                    var grd = ctx.createRadialGradient(node.x - 13, node.y - 15, 0, node.x, node.y, radius);
                    grd.addColorStop(0, color[0]);
                    grd.addColorStop(1, color[1]);
                    ctx.fillStyle = isShadow ? "#c7be95" : grd;
                    ctx.arc(node.x + shdwOffsetX, node.y + shdwOffsetY, radius + shdwOffsetRad, 0, 2 * Math.PI);
                    ctx.fill();
                    
                    // Labels
                    if (!isShadow){
                        ctx.beginPath();
                        ctx.fillStyle = "white";
                        ctx.textAlign = "center";
                        ctx.font = "30px Arial";
                        ctx.fillText(id, node.x, node.y + 10); 
                    }  
                }
                
                function needsCurve(startNode, endNode){
                    
                    return ((hasRecip(startNode, endNode) || isDupAtoB(startNode, endNode)) && hasEdgeSet(startNode, endNode)); 
                }
                
                function hasRecip(startNode, endNode){
                    return (startNode.parents.has(endNode.name) && startNode.parents.get(endNode.name).size > 0);
                }
                
                function isDupAtoB(startNode, endNode){
                    return (endNode.parents.has(startNode.name) && endNode.parents.get(startNode.name).size > 1);
                }
                
                function hasEdgeSet(startNode, endNode){
                    let edgeSet = endNode.parents.get(startNode.name);
                    return edgeSet !== undefined;
                }
                
                
                function drawEdge(curEdge, isShadow, ctx, color = "green"){
                    
                    let startNode = nodeMap.get(curEdge.from + 1);
                    let endNode = nodeMap.get(curEdge.to + 1);
                    
                    
                    var shadowOffsetX = isShadow ? 7 : 0;
                    var shadowOffsetY = isShadow ? 9 : 0;
                    var shadowOffsetXLabel = shadowOffsetX;
                    var shadowOffsetYLabel = shadowOffsetY;
                    
                    // Edge leads back to the same node
                    // TODO: If there are multiple self-joining edges, the radius needs to expand, so put in a while loop
                    if (startNode === endNode){
                        ctx.beginPath();
                        
                        if (isDirected){
                            
                            ctx.ellipse(startNode.x + shadowOffsetX, startNode.y + 45 + shadowOffsetY, 25, 15, 90 * Math.PI/180, 210 * Math.PI/180, 100 * Math.PI/180);
                        }   else    {
                            ctx.ellipse(startNode.x + shadowOffsetX, startNode.y + 45 + shadowOffsetY, 25, 15, 90 * Math.PI/180, 0, 2 * Math.PI);
                        }
                        
                        ctx.strokeStyle = isShadow ? "#c7be95" : color;
                        ctx.lineWidth = 5;
                        ctx.stroke();
                        
                        if (isDirected){
                            ctx.beginPath();
                            ctx.moveTo(startNode.x - 12 + shadowOffsetX, startNode.y + 27 + shadowOffsetY); 
                            ctx.lineTo(startNode.x - 23 + shadowOffsetX, startNode.y + 27 + 13 + shadowOffsetY);
                            ctx.lineTo(startNode.x - 5 + shadowOffsetX, startNode.y + 27 + 16 + shadowOffsetY);
                            ctx.closePath();
                            ctx.fillStyle = isShadow ? "#c7be95" : color;
                            ctx.fill();
                            
                        }
                        
                        // Label
                        if (isWeighted){
                            ctx.beginPath();
                            ctx.font = "30px Arial";
                            ctx.textAlign = "center";
                            ctx.fillStyle = isShadow ? "#c7be95" : color;
                            let edgeTxt = "" + curEdge.weight;
                            let txtLen = edgeTxt.length;
                            edgeTxt = isShadow ? "" : edgeTxt;
                            ctx.fillRect(startNode.x + shadowOffsetXLabel - txtLen * 8 - 4, startNode.y + shadowOffsetYLabel - 15 + 70, txtLen * 16 + 8, 30);
                            ctx.fillStyle = "white";
                            ctx.fillText(edgeTxt, startNode.x, startNode.y + 80); 
                        }
                    
                        // Need curved line to avoid overlap
                    }   else if (needsCurve(startNode, endNode)) {
                        
                        let curEdgeSet = endNode.parents.get(startNode.name);                     
                        let curveAmt = isDupAtoB(startNode, endNode) ? (!hasRecip(startNode, endNode) ? 5 : 35) : 40; // amount of 'bow' in the curve, increases as more recip/dup edges are added
                        let alreadyDrawn = new Set();
                         
                        
                        //NOTE: the following is the nearly same as for directed edge, except for quadratic curve, so this should be refactored to avoid redundancy
                            
                            for (let tempEdge of curEdgeSet){

                                ctx.save();
                                var dx = endNode.x - startNode.x;
                                var dy = endNode.y - startNode.y;
                                var angle = Math.atan2(dy, dx);
                                var len = Math.sqrt(dx * dx + dy * dy) - endNode.radius; //subtract radius so arrow touches edge
                                ctx.translate(startNode.x, startNode.y);
                                ctx.rotate(angle);
                                var curShadowOffsetX = Math.round(Math.sin(angle * (Math.PI / 180)) * shadowOffsetX, 2);
                                var curShadowOffsetY = Math.round(Math.cos(angle * (Math.PI / 180)) * shadowOffsetY, 2);
                                var tempDn;
                                if (angle <= 0){
                                    tempDn = Math.abs(2.2 - Math.abs(angle));
                                } else {
                                    tempDn = Math.abs(1 - angle);
                                }

                                if (tempDn < 1){
                                    curShadowOffsetX *= tempDn;
                                    curShadowOffsetY *= tempDn;
                                }

                                curShadowOffsetX *= (angle > -2.2 && angle <= 0) || (angle > 0 && angle <= 1) ? 1 : -1;
                                curShadowOffsetY *= (angle > -2.2 && angle <= 0) || (angle > 0 && angle <= 1) ? 1 : -1;

                                // curve
                                ctx.lineCap = 'round';
                                ctx.beginPath();
                                ctx.moveTo(curShadowOffsetX, curShadowOffsetY + 10);
                                ctx.quadraticCurveTo(len / 2 + curShadowOffsetX, curveAmt + curShadowOffsetY, len + curShadowOffsetX + (isDirected? -15 : 0), curShadowOffsetY);
                                ctx.strokeStyle = isShadow ? "#c7be95" : color;
                                ctx.lineWidth = 5;
                                ctx.stroke();

                                // arrowhead
                                if (isDirected){
                                    ctx.beginPath();
                                    ctx.moveTo(len - 15 + curShadowOffsetX, curShadowOffsetY - 10);
                                    ctx.lineTo(len + curShadowOffsetX, curShadowOffsetY);
                                    ctx.lineTo(len - 15 + curShadowOffsetX, 10 + curShadowOffsetY);
                                    ctx.closePath();
                                    ctx.fillStyle = isShadow ? "#c7be95" : color;
                                    ctx.fill();
                                }
                                
                                //label
                                if (isWeighted){
                                    
                                    ctx.beginPath();
                                    var txtX = len / 2 + curShadowOffsetX;
                                    var txtY = curShadowOffsetY + curveAmt / 2;
                                    ctx.font = "30px Arial";
                                    ctx.textAlign = "center";
                                    ctx.fillStyle = isShadow ? "#c7be95" : color;
                                    let edgeTxt = "" + tempEdge.weight;
                                    let txtLen = edgeTxt.length;
                                    edgeTxt = isShadow ? "" : edgeTxt;
                                    ctx.translate(txtX, txtY);
                                    ctx.rotate(-angle);
                                    ctx.fillRect(-(txtLen * 8 + 4), -15, txtLen * 16 + 8, 30);
                                    ctx.textBaseline = "middle";
                                    ctx.fillStyle = "white";
                                    ctx.fillText(edgeTxt, 0, 2);
                                }
                           
                                ctx.restore();
                                curveAmt += 70;
                             
                            
                            }
                        
                        } else if (isDirected){
                    
                        ctx.save();
                        var dx = endNode.x - startNode.x;
                        var dy = endNode.y - startNode.y;
                        var angle = Math.atan2(dy, dx);
                        var len = Math.sqrt(dx * dx + dy * dy) - endNode.radius; //subtract radius so arrow touches edge
                        ctx.translate(startNode.x, startNode.y);
                        ctx.rotate(angle);
                        shadowOffsetX = Math.round(Math.sin(angle * (Math.PI / 180)) * shadowOffsetX, 2);
                        shadowOffsetY = Math.round(Math.cos(angle * (Math.PI / 180)) * shadowOffsetY, 2);
                        var tempDn;
                        if (angle <= 0){
                            tempDn = Math.abs(2.2 - Math.abs(angle));
                        } else {
                            tempDn = Math.abs(1 - angle);
                        }
                        
                        if (tempDn < 1){
                            shadowOffsetX *= tempDn;
                            shadowOffsetY *= tempDn;
                        }
                        
                        shadowOffsetX *= (angle > -2.2 && angle <= 0) || (angle > 0 && angle <= 1) ? 1 : -1;
                        shadowOffsetY *= (angle > -2.2 && angle <= 0) || (angle > 0 && angle <= 1) ? 1 : -1;
                    
                        // line
                        ctx.lineCap = 'round';
                        ctx.beginPath();
                        ctx.moveTo(shadowOffsetX, shadowOffsetY);
                        ctx.lineTo(len - 5 + shadowOffsetX, shadowOffsetY);
                        ctx.strokeStyle = isShadow ? "#c7be95" : color;
                        ctx.lineWidth = 5;
                        ctx.stroke();

                        // arrowhead
                        ctx.beginPath();
                        ctx.moveTo(len - 15 + shadowOffsetX, shadowOffsetY - 10);
                        ctx.lineTo(len + shadowOffsetX, shadowOffsetY);
                        ctx.lineTo(len - 15 + shadowOffsetX, 10 + shadowOffsetY);
                        ctx.closePath();
                        ctx.fillStyle = isShadow ? "#c7be95" : color;
                        ctx.fill();

                        ctx.restore(); 
                    
                    } else {
                       
                        ctx.beginPath();
                        ctx.moveTo(startNode.x + shadowOffsetX, startNode.y + shadowOffsetY);
                        ctx.lineTo(endNode.x + shadowOffsetX, endNode.y + shadowOffsetY);
                        ctx.strokeStyle = isShadow ? "#c7be95" : color;
                        ctx.lineWidth = 5;
                        ctx.stroke();
                    }
                    
                    // Labels
                    if (isWeighted && startNode !== endNode && !needsCurve(startNode, endNode)){
                        ctx.beginPath();
                        var txtX = startNode.x + (endNode.x - startNode.x) / 2;
                        var txtY = startNode.y + (endNode.y - startNode.y) / 2;
                        ctx.font = "30px Arial";
                        ctx.textAlign = "center";
                        ctx.fillStyle = isShadow ? "#c7be95" : color;
                        let edgeTxt = "" + curEdge.weight;
                        let txtLen = edgeTxt.length;
                        edgeTxt = isShadow ? "" : edgeTxt;
                        
                        ctx.fillRect(txtX + shadowOffsetXLabel - txtLen * 8 - 4, txtY + shadowOffsetYLabel - 15, txtLen * 16 + 8, 30);
                        ctx.fillStyle = "white";
                        
                        ctx.fillText(edgeTxt, txtX, txtY + 10);
                    }
                
                }
                
                $gel("numNodesTxt").addEventListener("keyup",  updateNumNodes);
                $gel("addEdge").addEventListener("click", ()=>{addEdge();});
                $gel("isDirected").addEventListener("change", updateDirected);
                $gel("isWeighted").addEventListener("change", updateWeighted);
                $gel("scaleInpt").addEventListener("input", updateScale);
                function selectTab(tab){
                    
                    let ui = tab.id.replace("Btn", "");
                    
                    //return if tab is already active
                    if (tab.classList.contains("btnActive")){
                        return;
                    }
                    
                    let btns = document.getElementsByClassName("tabBtn");
                    for (let btn of btns){
                        
                        let ui = btn.id.replace("Btn", "");
                        
                        if (btn.id === tab.id){
                            btn.classList.add("btnActive");
                            $gel(ui).classList.remove("hideUI");
                            continue;
                        }
                        
                        btn.classList.remove("btnActive");
                        $gel(ui).classList.add("hideUI");
                    }
                }

                let btns = document.getElementsByClassName("tabBtn");
                Array.prototype.forEach.call(btns, (e)=>{e.addEventListener("click", (e)=>{return selectTab(e.target)})});  
 
            }