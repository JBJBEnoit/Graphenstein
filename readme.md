# Welcome to Graphenstein

This is a browser-based app for exploring common graph algorithms, written in a combination of C++
compiled to WebAssembly, vanilla JavaScript, HTML and CSS (hence the Frankenstein reference in its name).

This project runs on a web browser as a mainly client-side application. It does, however,
require a server to run properly (running it from a localhost works fine).

A live deployment can be found here: [Try Out Graphenstein](https://jbjbenoit.github.io/Graphenstein/)

To get started:
- Add a number of nodes for your graph. Nodes will appear in the main window, and can be dragged into whatever configuration you choose
- Add edges to your graph.
- If your graph is directed or weighted, check the appropriate boxes and update accordingly.
- Switch to the Algorithms tab to run various graph algorithms.

The C++ code that contains the algorithms and has been compiled into WebAssembly is included ("graphs.cpp") for your perusal.

Thanks for checking out Graphensein -- enjoy!
