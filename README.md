# DrawingApp
This is a realtime, room-based drawing app based on websockets, through Flask-SocketIO.  I created this to tool to easily collaborate with friends on Math and Physics homework, despite living so far away.  This app is ideal for tutoring and collaborating with others.  Visit the live demo at http://138.197.113.251:8080/ (domain name pending).  Features include:
  - A myriad of tools to choose from, with customizable line thickness and color
  - Undo and redo commands
  - Panning (and soon hopefully zooming) the canvas
  - Toggleable Cartesian Coordinate Grid to help draw accurate graphs
  - Download canvas as an image, so you can save your work for later reference
  - A built-in chat system
  - Public and Private Rooms
  - Anonymous user system

Many other features are currently under development, such as:
- A page-based canvas system
- Ability to moderate other users in room, including: kicking, muting, and whitelist-limitting drawing
- More tools
- Performance and bug fixes
- Many other miscellaneous things.


## Contributing
Contributions are always welcome, in a multitude of ways.  If you are a fellow developer, feel free to work on implementing any of the above features, or give me feedback on my implementation of existing features-- there are undoubtedly better, cleaner ways to go about some of them, and I always enjoy seeing where my work can be improved.  
If you don't have any tech knowledge but would like to help the project, worry not.  There are undoubtedly a multitude of bugs in the program, waiting to be discovered.  I use the app as much as possible with my friends, but we are a relatively small group and are unlikely to encounter all the bugs that exist.  Use the app and report any bugs you find here.  Similarly, if you have any suggestions or features you would like to see added, feel free to open a ticket.  I welcome any and all feedback.

## Documentation
Currently, none exists-- this should be fixed ASAP.

## Acknowledgements
All of the code here is my own work, unless explicitly noted otherwise in the source file.  (E.g., I remember there is a function for detecting collision with a triangle which I took from Stack Overflow, and this area of code is marked as such, with a link to the SO question).

Since design is not my strongest area, many of the UI decisions were heavily inspired by https://aggie.io -- although again, the implementation is my own.
