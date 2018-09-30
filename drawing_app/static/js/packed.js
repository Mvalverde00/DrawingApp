COMMAND_IDS=new Array(300);function register_command(child,parent){child.prototype=Object.create(parent.prototype);child.prototype.constructor=child;switch(parent.name){case'Shape':COMMAND_IDS[register_command.curr_shape_id++]=child;break;case'Path':COMMAND_IDS[register_command.curr_path_id++]=child;break;case'Command':if(child.name!='AddShape')COMMAND_IDS[register_command.curr_command_id++]=child;break;}}
register_command.curr_shape_id=0;register_command.curr_path_id=100;register_command.curr_command_id=200;function Shape(x,y,width,height,stroke_color,fill_color,fill,line_width=1,theta=0,id=-1){if(width>=0){this.x=x;this.width=width;}else{this.x=x+width;this.width=-width;}
if(height>=0){this.y=y;this.height=height;}else{this.y=y+height;this.height=-height;}
this.stroke_color=stroke_color;this.fill_color=fill_color;this.fill=fill;this.line_width=line_width;this.theta=theta;this.id=id;this.set_id=function(id){if(this.id==-1){string_to_hash=(this.x+Date.now()).toString();this.id=md5(string_to_hash);}}
this.package=function(){return[this.x,this.y,this.width,this.height,this.stroke_color,this.fill_color,this.fill,this.line_width,this.theta,this.id];}
this.package_inbetween=function(){return[this.width,this.height,this.id];}
this.apply_package_inbetween=function(data){this.width=data[0];this.height=data[1];}
this.render=function(ctx){}
this.draw=function(ctx){ctx.lineWidth=this.line_width;ctx.strokeStyle=this.stroke_color;ctx.fillStyle=this.fill_color;[cx,cy]=this.get_center();ctx.translate(cx,cy);ctx.rotate(this.theta);ctx.translate(-cx,-cy);this.render(ctx);ctx.setTransform(1,0,0,1,-c.camera.x,-c.camera.y);}
this.collision_base=function(mx,my){return mx>=this.x-this.line_width/2&&mx<=(this.x+this.width+this.line_width/2)&&my>=this.y-this.line_width/2&&my<=(this.y+this.height+this.line_width/2);}
this.collision=function(mx,my){[mx,my]=this.rotate_point(mx,my);return this.collision_base(mx,my)}
this.translate=function(sx,sy,ex,ey){var dx=ex-sx;var dy=ey-sy;this.x+=dx;this.y+=dy;if(this.hasOwnProperty('p2')){this.p2=[this.x+this.width,this.y+this.height];this.p3=[this.p2[0],this.y];}}
this.draw_selection_box=function(ctx){ctx.setLineDash([10,10]);ctx.strokeStyle='#42e2f4';temp_fill=this.fill;this.fill=false;this.draw(ctx);this.fill=temp_fill;ctx.setLineDash([]);}
this.get_center=function(){return[this.x+(this.width/2),this.y+(this.height/2)];}
this.draw_rotation_handle=function(ctx){var[cx,cy]=this.get_center();ctx.save();ctx.translate(cx,cy);ctx.rotate(this.theta);ctx.drawImage(rotation_image,(-image_width/2),-(Math.abs(this.height/2)+this.line_width/2+image_height+10),image_width,image_height);ctx.restore();}
this.rotation_handle_collision=function(mx,my){[mx,my]=this.rotate_point(mx,my);var[cx,cy]=this.get_center();var x=(cx-image_width/2);var y=cy-(Math.abs(this.height/2)+this.line_width/2+image_height+10);return mx>=x&&mx<=(x+image_width)&&my>=y&&my<=(y+image_height);}
this.rotate_point=function(px,py,additional_rotation=0){var[cx,cy]=this.get_center();var x=Math.cos(2*Math.PI-this.theta+additional_rotation)*(px-cx)-Math.sin(2*Math.PI-this.theta+additional_rotation)*(py-cy)+cx;var y=Math.sin(2*Math.PI-this.theta+additional_rotation)*(px-cx)+Math.cos(2*Math.PI-this.theta+additional_rotation)*(py-cy)+cy;return[x,y];}
this.is_in_between=function(a,b,c,error_margin=2){return Math.min(b,c)-error_margin<a&&a<Math.max(b,c)+error_margin;}}
function Rectangle(x,y,width,height,stroke_color,fill_color,fill,line_width=1,theta=0,id=-1){Shape.call(this,x,y,width,height,stroke_color,fill_color,fill,line_width,theta,id);this.render=function(ctx){if(this.fill)ctx.fillRect(this.x,this.y,this.width,this.height);ctx.strokeRect(this.x,this.y,this.width,this.height);}
this.collision=function(mx,my){[mx,my]=this.rotate_point(mx,my);if(this.fill){return mx>=this.x-this.line_width/2&&mx<=(this.x+this.width+this.line_width/2)&&my>=this.y-this.line_width/2&&my<=(this.y+this.height+this.line_width/2);}
else{let ERROR_MARGIN=4;let top=Utility.customIsPointInPath(mx,my,this.x,this.y,this.x+this.width,this.y,this.line_width/2+ERROR_MARGIN);let bottom=Utility.customIsPointInPath(mx,my,this.x,this.y+this.height,this.x+this.width,this.y+this.height,this.line_width/2+ERROR_MARGIN);let left=Utility.customIsPointInPath(mx,my,this.x,this.y,this.x,this.y+this.height,this.line_width/2+ERROR_MARGIN);let right=Utility.customIsPointInPath(mx,my,this.x+this.width,this.y,this.x+this.width,this.y+this.height,this.line_width/2+ERROR_MARGIN);return top||bottom||left||right;}}}
register_command(Rectangle,Shape);function Line(x,y,width,height,stroke_color,fill_color=null,fill=false,line_width=1,theta=0,id=-1){Shape.call(this,x,y,width,height,stroke_color,fill_color,fill,line_width,theta,id);this.x=x;this.y=y;this.width=width;this.height=height;this.render=function(ctx){ctx.beginPath();ctx.moveTo(this.x,this.y);ctx.lineTo(this.x+this.width,this.y+this.height);ctx.stroke();}
this.collision=function(mx,my){return Utility.customIsPointInPath(mx,my,this.x,this.y,this.x+this.width,this.y+this.height,this.line_width/2+4);}}
register_command(Line,Shape);function Circle(x,y,width,height,stroke_color,fill_color,fill,line_width=1,theta=0,id=-1){Shape.call(this,x,y,width,height,stroke_color,fill_color,fill,line_width,theta,id);this.radius=round(Math.sqrt((this.x-(this.x+this.width))*(this.x-(this.x+this.width))+(this.y-(this.y+this.height))*(this.y-(this.y+this.height))));this.draw=function(ctx){ctx.lineWidth=this.line_width;ctx.strokeStyle=this.stroke_color;ctx.beginPath();ctx.arc(this.x,this.y,this.radius,0,2*Math.PI);if(this.fill){ctx.fillStyle=this.fill_color;ctx.fill();}
ctx.stroke();}
this.package_inbetween=function(){return[this.radius,this.id];}
this.apply_package_inbetween=function(data){this.radius=data[0];}
this.collision=function(mx,my){[mx,my]=this.rotate_point(mx,my);if(this.fill)return(mx-this.x)*(mx-this.x)+(my-this.y)*(my-this.y)<=this.radius*this.radius;else{var ERROR_MARGIN=5;var in_outer_circle=(mx-this.x)*(mx-this.x)+(my-this.y)*(my-this.y)<=(this.radius+ERROR_MARGIN)*(this.radius+ERROR_MARGIN);var in_inner_circle=(mx-this.x)*(mx-this.x)+(my-this.y)*(my-this.y)<=(this.radius-ERROR_MARGIN)*(this.radius-ERROR_MARGIN);return in_outer_circle&&!in_inner_circle;}}
this.get_center=function(){return[this.x,this.y];}
this.draw_rotation_handle=function(ctx){var[cx,cy]=this.get_center();ctx.drawImage(rotation_image,cx,cy-(this.radius+image_height+5),image_width,image_height);}
this.rotation_handle_collision=function(mx,my){var[cx,cy]=this.get_center();var x=(cx-image_width/2);var y=cy-(this.radius/2+image_height+5)
return mx>=x&&mx<=(x+image_width)&&my>=y&&my<=(y+image_height);}}
register_command(Circle,Shape);function Triangle(x,y,width,height,stroke_color,fill_color,fill,line_width=1,theta=0,id=-1){Shape.call(this,x,y,width,height,stroke_color,fill_color,fill,line_width,theta,id);this.p2=[this.x+this.width,this.y+this.height];this.p3=[this.p2[0],this.y];this.render=function(ctx){ctx.beginPath();ctx.moveTo(this.x,this.y);ctx.lineTo(this.x,this.y+this.height);ctx.lineTo(this.x+this.width,this.y+this.height);ctx.lineTo(this.x,this.y);if(this.fill)ctx.fill();ctx.stroke();}
this.collision=function(mx,my){[mx,my]=this.rotate_point(mx,my,Math.PI);if(this.fill){var p0=[this.x,this.y];var p1=this.p2;var p2=this.p3;var area=.5*(-p1[1]*p2[0]+p0[1]*(-p1[0]+p2[0])+p0[0]*(p1[1]-p2[1])+p1[0]*p2[1]);var s=1/(2*area)*(p0[1]*p2[0]-p0[0]*p2[1]+(p2[1]-p0[1])*mx+(p0[0]-p2[0])*my);var t=1/(2*area)*(p0[0]*p1[1]-p0[1]*p1[0]+(p0[1]-p1[1])*mx+(p1[0]-p0[0])*my);return s>0&&t>0&&(1-s-t)>0;}
else{var l1=Utility.customIsPointInPath(mx,my,this.x,this.y,this.p2[0],this.p2[1]);var l2=Utility.customIsPointInPath(mx,my,this.p2[0],this.p2[1],this.p3[0],this.p3[1]);var l3=Utility.customIsPointInPath(mx,my,this.p3[0],this.p3[1],this.x,this.y);return l1||l2||l3;}}
this.collision_line_helper=function(mx,my,x1,y1,x2,y2){var m=(y2-y1)/(x2-x1);var b=y1-m*x1;var ERROR_MARGIN=4;var on_line;if(m==Infinity)on_line=Math.abs(mx-x1)<ERROR_MARGIN;else on_line=Math.abs(m*mx+b-my)<ERROR_MARGIN;var in_x_range=(((mx+ERROR_MARGIN)>=x1)&&((mx-ERROR_MARGIN)<=x2))||(((mx+ERROR_MARGIN)<=x1)&&((mx-ERROR_MARGIN)>=x2));var in_y_range=(((my+ERROR_MARGIN)>=y1)&&((my-ERROR_MARGIN)<=y2))||(((my+ERROR_MARGIN)<=y1)&&((my-ERROR_MARGIN)>=y2));return on_line&&in_x_range&&in_y_range;}}
register_command(Triangle,Shape);function Resistor(x,y,width,height,stroke_color,fill_color,fill,line_width=1,theta=0,id=-1){Shape.call(this,x,y,width,height,stroke_color,fill_color,fill,line_width,theta,id);this.end_width_percentage=0.4;this.wave_percentage=0.6;this.waves=3;this.wave_len=this.width*this.wave_percentage/this.waves;this.render=function(ctx){this.mid=this.y+this.height/2;this.top=this.y;this.bottom=this.y+this.height;ctx.beginPath();ctx.moveTo(this.x,this.mid);ctx.lineTo(this.x+(this.width*this.end_width_percentage/2),this.mid);for(let i=0;i<this.waves;i++){let base_distance=this.x+(this.width*this.end_width_percentage/2)+(this.wave_len*i);ctx.lineTo(base_distance+(this.wave_len/3),this.top);ctx.lineTo(base_distance+(2*this.wave_len/3),this.bottom);ctx.lineTo(base_distance+this.wave_len,this.mid);}
ctx.lineTo(this.x+this.width,this.mid);ctx.stroke();}}
register_command(Resistor,Shape);function Settings(stroke_color,fill_color,fill,tool,line_width){this.stroke_color=stroke_color;this.fill_color=fill_color;this.fill=fill;this.tool=tool;this.line_width=line_width;this.set_tool=function(tool){tool=parseInt(tool);if(typeof(tool)=="number"){this.tool=tool;}
else{this.tool=0;}}
this.set_stroke_color=function(stroke_color){this.stroke_color=stroke_color;}
this.set_fill_color=function(fill_color){this.fill_color=fill_color;}
this.set_fill=function(fill){this.fill=fill;}
this.set_line_width=function(width){this.line_width=parseInt(width);}}
function User(username){this.username=username;this.settings=new Settings('#000000','#ffffff',false,0,1);}
function DataManager(){}
DataManager.unpackage=function(array){var params=array.splice(1,array.length-1);var command=new COMMAND_IDS[array[0]](...params);if(!(command.hasOwnProperty('target_id'))){command=new AddShape(command);}
return command;}
DataManager.package=function(command){if(command.constructor==AddShape)command=command.shape;let array=command.package();array.splice(0,0,COMMAND_IDS.indexOf(command.constructor));console.log(array);return array;}
function get_attributes(command){var array=Object.keys(command).map(function(attribute){return command[attribute];})
var newarr=array.filter(function(attribute){return typeof(attribute)!=='function'})
return newarr;}
function Command(target_id,id=-1){this.target_id=target_id;this.id=id;this.set_id=function(){if(this.id==-1){string_to_hash=this.target_id+Date.now();this.id=md5(string_to_hash);}}
this.execute=function(){};this.undo=function(){};this.package=function(){};}
function AddShape(shape){Command.call(this,shape.id,shape.id);this.shape=shape;this.execute=function(array){console.log('executing');array.push(this.shape);}
this.undo=function(array){console.log('undoing');for(let i=array.length-1;i>=0;i--){if(array[i].id==this.target_id){array.splice(i,1);break;}}}
this.apply_package_inbetween=function(data){this.shape.apply_package_inbetween(data);}}
register_command(AddShape,Command);function Move(shape_id,sx,sy,ex,ey,id=-1){Command.call(this,shape_id,id);this.sx=parseFloat(sx);this.sy=parseFloat(sy);this.ex=parseFloat(ex);this.ey=parseFloat(ey);this.execute=function(array){for(let shape of array){if(shape.id==this.target_id){shape.translate(this.sx,this.sy,this.ex,this.ey);break;}}}
this.undo=function(array){for(let shape of array){if(shape.id==this.target_id){shape.translate(this.ex,this.ey,this.sx,this.sy);break;}}}
this.package=function(){return[this.target_id,this.sx,this.sy,this.ex,this.ey,this.id];}
this.package_inbetween=function(){return[this.sx,this.sy,this.ex,this.ey,this.id]}
this.apply_package_inbetween=function(data){this.sx=data[0];this.sy=data[1];this.ex=data[2];this.ey=data[3];}}
register_command(Move,Command);function Rotate(shape_id,theta,id=-1){Command.call(this,shape_id,id);this.theta=parseFloat(theta);this.execute=function(array){for(let shape of array){if(shape.id==this.target_id){shape.theta+=this.theta;break;}}}
this.undo=function(array){for(let shape of array){if(shape.id==this.target_id){shape.theta-=this.theta;break;}}}
this.package=function(){return[this.target_id,this.theta,this.id]}
this.package_inbetween=function(){return[this.theta,this.id];}
this.apply_package_inbetween=function(data){this.theta=data[0]}}
register_command(Rotate,Command);function ShapeManager(cw,ch,camera){let self=this;this.canvas=document.createElement('canvas');this.cw=cw;this.ch=ch;this.canvas.width=cw;this.canvas.height=ch;this.ctx=this.canvas.getContext('2d');this.ctx.lineCap='round';this.camera=camera;this.page_manager=new PageManager();[this.shapes,this.command_history,this.undo_history,this.pending_commands,this.inbetween_commands,this.pending_clear,this.pending_undo]=this.page_manager.get_current_page().get_all();this.current_shape=null;this.current_shape_state=SelectStates.NOSHAPE;this.current_transformation=null;this.execute_command=function(command){command.execute(this.shapes);this.command_history.push(command);this.undo_history.length=0;this.render();};this.undo_command=function(hash){let command=null;for(let i=this.command_history.length-1;i>=0;i--){if(this.command_history[i].id==hash)command=this.command_history.splice(i,1)[0];}
if(command!=null){command.undo(this.shapes);this.undo_history.push(command);if(this.current_shape!=null&&this.current_shape.id==command.id){this.current_shape=null;this.current_shape_state=SelectStates.NOSHAPE;this.current_transformation=null;}
for(let i=this.pending_undo.length-1;i>=0;i--){if(this.pending_undo[i].id==hash)this.pending_undo.splice(i,1);}}};this.redo_command=function(command){console.log(command)
for(let i=this.undo_history.length-1;i>=0;i--){if(this.undo_history[i].id==command.id)this.undo_history.splice(i,1);}
command.execute(this.shapes)
this.command_history.push(command);}
this.render=function(){this.ctx.clearRect(this.camera.x,this.camera.y,this.cw,this.ch);if(!this.pending_clear){for(let command of this.inbetween_commands){if(command.hasOwnProperty('execute'))command.execute(this.shapes);}
for(let command of this.pending_commands){if(command.hasOwnProperty('execute'))command.execute(this.shapes);}
for(let command of this.pending_undo){if(command.hasOwnProperty('undo'))command.undo(this.shapes);}
if(this.current_transformation!=null)this.current_transformation.execute(this.shapes);for(let shape of this.shapes){shape.draw(this.ctx);}
for(let command of this.pending_commands){if(command.hasOwnProperty('draw'))command.draw(this.ctx);}
if(this.current_shape_state==SelectStates.NOSHAPE&&this.current_shape!=null){this.current_shape.draw(this.ctx);}
if(this.current_shape_state!=SelectStates.NOSHAPE){this.current_shape.draw_selection_box(this.ctx);this.current_shape.draw_rotation_handle(this.ctx);}
if(this.current_transformation!=null)this.current_transformation.undo(this.shapes);for(let command of this.pending_undo){if(command.hasOwnProperty('execute'))command.execute(this.shapes);}
for(let command of this.pending_commands){if(command.hasOwnProperty('undo'))command.undo(this.shapes);}
for(let command of this.inbetween_commands){if(command.hasOwnProperty('undo'))command.undo(this.shapes);}}
this.draw_border();}
this.get_collision=function(x,y){for(let i=this.shapes.length-1;i>=0;i--){if(this.shapes[i].hasOwnProperty('collision')){if(this.shapes[i].collision(x,y))return this.shapes[i];}}
return null;}
this.draw_border=function(){this.ctx.lineWidth=10;this.ctx.strokeStyle='#000000';this.ctx.strokeRect(-this.cw*2-this.camera.x,-this.ch*2-this.camera.y,this.cw*4+this.camera.x,this.ch*4+this.camera.y);}
this.clear=function(){this.shapes.length=0;this.command_history.length=0;this.undo_history.length=0;this.pending_commands.length=0;this.inbetween_commands.length=0;this.pending_clear=false;this.pending_undo.length=0;this.current_shape=null;this.current_shape_state=SelectStates.NOSHAPE;this.current_transformation=null;}
this.set_page=function(page){[this.shapes,this.command_history,this.undo_history,this.pending_commands,this.inbetween_commands,this.pending_clear,this.pending_undo]=this.page_manager.set_page(page);}
document.getElementById('page-left').addEventListener('mousedown',function(){self.set_page(self.page_manager.curr_page-1);});document.getElementById('page-right').addEventListener('mousedown',function(){self.set_page(self.page_manager.curr_page+1);});}
var mouse={x:0,y:0,startX:0,startY:0,isDown:false};var IDS={RECTANGLE:0,LINE:1,FREEDRAW:2,CIRCLE:3,TRIANGLE:4,ERASER:5,SELECT:6,PAN:7,RESISTOR:8};var SelectStates={NOSHAPE:0,SELECTED:1,MOVING:2,ROTATING:3,RESIZING:4};var user_manager=new UserManager();var chat_manager=new ChatManager();const image_height=30;const image_width=30;const rotation_image=new Image();rotation_image.src='/static/img/rotate.png';function round(number){return Math.round(number*100)/100}
function Display(){this.mouse_x=document.getElementById('mouse-x');this.mouse_y=document.getElementById('mouse-y');this.canvas_x=document.getElementById('canvas-x');this.canvas_y=document.getElementById('canvas-y');}
var display=new Display();function setMousePos(canvas,evt){var rect=canvas.getBoundingClientRect(),scaleX=canvas.width/rect.width,scaleY=canvas.height/rect.height;mouse.x=round(((evt.clientX-rect.left)*scaleX/c.camera.scale)),mouse.y=round(((evt.clientY-rect.top)*scaleY/c.camera.scale));[mouse.x,mouse.y]=c.camera.translate_mouse_coords(mouse.x,mouse.y);display.mouse_x.innerHTML=mouse.x;display.mouse_y.innerHTML=mouse.y;}
var c=new function(){this.canvas=document.getElementById('canvas');this.ctx=canvas.getContext('2d');this.ctx.lineCap='round';this.user=new User("testuser");this.camera=new Camera(this.canvas.width,this.canvas.height);this.shape_manager=new ShapeManager(this.canvas.width,this.canvas.height,this.camera);this.camera.ctx=this.shape_manager.ctx;this.layer_manager=new LayerManager(this.canvas,this.ctx,this.shape_manager,this.camera);this.interpolation_manager=new InterpolationManager();this.canvas.addEventListener('mousedown',function(e){e.preventDefault();if(e.button==0){c.onMouseDown();}},false);window.addEventListener('contextmenu',function(e){e.preventDefault();},false)
window.addEventListener('mouseup',function(e){c.onMouseUp();},false);this.canvas.addEventListener('mousewheel',function(e){e.preventDefault();c.onMouseWheel(e);},false)
window.addEventListener('mousemove',function(e){c.layer_manager.render();setMousePos(canvas,e);if(mouse.isDown){switch(c.user.settings.tool){case IDS.RECTANGLE:c.shape_manager.current_shape=new Rectangle(mouse.startX,mouse.startY,round(mouse.x-mouse.startX),round(mouse.y-mouse.startY),c.user.settings.stroke_color,c.user.settings.fill_color,c.user.settings.fill,c.user.settings.line_width);break;case IDS.LINE:c.shape_manager.current_shape=new Line(mouse.startX,mouse.startY,round(mouse.x-mouse.startX),round(mouse.y-mouse.startY),c.user.settings.stroke_color,'#000000',false,line_width=c.user.settings.line_width);break;case IDS.FREEDRAW:c.shape_manager.current_shape.add_coords(mouse.x,mouse.y);break;case IDS.CIRCLE:c.shape_manager.current_shape=new Circle(mouse.startX,mouse.startY,round(mouse.x-mouse.startX),round(mouse.y-mouse.startY),c.user.settings.stroke_color,c.user.settings.fill_color,c.user.settings.fill,c.user.settings.line_width);break;case IDS.TRIANGLE:c.shape_manager.current_shape=new Triangle(mouse.startX,mouse.startY,round(mouse.x-mouse.startX),round(mouse.y-mouse.startY),c.user.settings.stroke_color,c.user.settings.fill_color,c.user.settings.fill,c.user.settings.line_width);break;case IDS.ERASER:c.shape_manager.current_shape.coords.push([mouse.x,mouse.y]);break;case IDS.SELECT:if(c.shape_manager.current_shape_state==SelectStates.MOVING){c.shape_manager.current_transformation=new Move(c.shape_manager.current_shape.id,mouse.startX,mouse.startY,mouse.x,mouse.y);}
else if(c.shape_manager.current_shape_state==SelectStates.ROTATING){[cx,cy]=c.shape_manager.current_shape.get_center();let opp=(cx-mouse.x);let adj=(cy-mouse.y);let theta=round(Math.atan2(adj,opp)-Math.PI/2-c.shape_manager.current_shape.theta);c.shape_manager.current_transformation=new Rotate(c.shape_manager.current_shape.id,theta);}
break;case IDS.PAN:c.camera.translate_canvas(mouse.startX,mouse.startY,mouse.x,mouse.y,c.ctx);display.canvas_x.innerHTML=c.camera.x;display.canvas_y.innerHTML=c.camera.y;break;case IDS.RESISTOR:c.shape_manager.current_shape=new Resistor(mouse.startX,mouse.startY,round(mouse.x-mouse.startX),round(mouse.y-mouse.startY),c.user.settings.stroke_color,c.user.settings.fill_color,c.user.settings.fill,c.user.settings.line_width);break;default:alert('something somewhere went wrong.');break;}
c.interpolation_manager.update_current(c.shape_manager.current_shape,c.shape_manager.current_transformation);}},false);this.onMouseUp=function(){mouse.isDown=false;if(this.user.settings.tool==IDS.SELECT){if(this.shape_manager.current_shape_state==SelectStates.MOVING){if(Math.sqrt((mouse.startX-mouse.x)*(mouse.startX-mouse.x)+(mouse.startY-mouse.y)*(mouse.startY-mouse.y))>2){this.shape_manager.current_transformation.set_id();this.shape_manager.pending_commands.push(this.shape_manager.current_transformation);sendShape(DataManager.package(this.shape_manager.current_transformation));}
this.shape_manager.current_transformation=null;this.shape_manager.current_shape_state=SelectStates.SELECTED;}
else if(this.shape_manager.current_shape_state==SelectStates.ROTATING){this.shape_manager.current_transformation.set_id();this.shape_manager.pending_commands.push(this.shape_manager.current_transformation);sendShape(DataManager.package(this.shape_manager.current_transformation));this.shape_manager.current_transformation=null;this.shape_manager.current_shape_state=SelectStates.SELECTED;}}
else{if(this.shape_manager.current_shape!=null){this.shape_manager.current_shape.set_id();this.shape_manager.pending_commands.push(this.shape_manager.current_shape);sendShape(DataManager.package(this.shape_manager.current_shape));}
this.shape_manager.current_shape=null;this.shape_manager.current_transformation=null;}
this.layer_manager.render();this.interpolation_manager.onMouseUp();}
this.onMouseDown=function(){mouse.isDown=true;mouse.startX=mouse.x;mouse.startY=mouse.y;switch(this.user.settings.tool){case IDS.FREEDRAW:this.shape_manager.current_shape=new FreeDraw(mouse.startX,mouse.startY,c.user.settings.stroke_color,c.user.settings.line_width,[[mouse.startX,mouse.startY]]);break;case IDS.ERASER:this.shape_manager.current_shape=new Eraser(mouse.startX,mouse.startY,c.user.settings.stroke_color,c.user.settings.line_width);break;case IDS.SELECT:clicked_shape=this.shape_manager.get_collision(mouse.x,mouse.y);if(this.shape_manager.current_shape_state==SelectStates.NOSHAPE){if(clicked_shape==null){this.shape_manager.current_shape_state=SelectStates.NOSHAPE;this.shape_manager.current_shape=null;}
else{this.shape_manager.current_shape=clicked_shape;this.shape_manager.current_shape_state=SelectStates.MOVING;}}
else if(this.shape_manager.current_shape_state==SelectStates.SELECTED){if(this.shape_manager.current_shape==clicked_shape)this.shape_manager.current_shape_state=SelectStates.MOVING;else if(this.shape_manager.current_shape.rotation_handle_collision(mouse.x,mouse.y))this.shape_manager.current_shape_state=SelectStates.ROTATING;else if(clicked_shape==null){this.shape_manager.current_shape_state=SelectStates.NOSHAPE;this.shape_manager.current_shape=null;}
else{this.shape_manager.current_shape=clicked_shape;this.shape_manager.current_shape_state=SelectStates.MOVING;}}
else{console.log('Error, Mousedown select should never result in something other than NOSHAPE or SELECTED');}
break;default:break;}
this.interpolation_manager.onMouseDown();}
this.onMouseWheel=function(e){let delta=e.wheelDelta/120;console.log(delta);this.camera.zoom_canvas(delta,mouse.x,mouse.y);this.layer_manager.render();display.canvas_x.innerHTML=this.camera.x;display.canvas_y.innerHTML=this.camera.y;}
this.set_tool=function(tool){this.shape_manager.current_shape_state=SelectStates.NOSHAPE;this.shape_manager.current_shape=null;this.shape_manager.current_transformation=null;console.log('setting tool');this.user.settings.set_tool(tool);}
this.toggle_background=function(input){this.layer_manager.background_enabled=input.checked;this.layer_manager.render();}
this.undo=function(){}
this.redo=function(){}
this.clear=function(){sendClear()}
this.download=function(parent_element,scope){let image=this.layer_manager.download(scope);parent_element.getElementsByTagName('a')[0].setAttribute('href',image);}}
function Path(x,y,line_width,stroke_color,coords=[],id=-1){this.x=x;this.y=y;this.line_width=line_width;this.stroke_color=stroke_color;if(typeof(coords)=='string'){this.coords=Utility.string_to_array(coords);}else{this.coords=coords;}
this.sent_coords_index=Math.max(this.coords.length-1,0);this.id=id;this.set_id=function(id){if(this.id==-1){string_to_hash=(this.x+Date.now()).toString();this.id=md5(string_to_hash);}}
this.add_coords=function(cx,cy){let[pcx,pcy]=this.coords[this.coords.length-1];if(Utility.distance(cx,cy,pcx,pcy)>Math.max(line_width/3,3)){this.coords.push([cx,cy]);}}
this.package=function(){};this.package_inbetween=function(){this.remove_unnecessary_points();let coords_to_send=this.coords.slice(this.sent_coords_index);this.sent_coords_index=this.coords.length-1;return[Utility.array_to_string(coords_to_send),this.id];}
this.apply_package_inbetween=function(data){data[0]=Utility.string_to_array(data[0]);this.coords=this.coords.concat(data[0]);}
this.remove_unnecessary_points=function(){let[sx,sy]=this.coords[this.sent_coords_index];for(let i=this.sent_coords_index+2;i<this.coords.length;i++){let[ex,ey]=this.coords[i];let[px,py]=this.coords[i-1];if(Utility.customIsPointInPath(px,py,sx,sy,ex,ey,5)){this.coords.splice(i-1,1)
console.log('removing some points');}
else{[sx,sy]=[ex,ey];}}}}
function FreeDraw(x,y,stroke_color,line_width=1,coords=[],id=-1){Path.call(this,x,y,line_width,stroke_color,coords,id);this.draw=function(ctx){ctx.strokeStyle=this.stroke_color;ctx.lineWidth=this.line_width;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y);for(let coord of this.coords){ctx.lineTo(coord[0],coord[1]);}
ctx.stroke();}
this.package=function(){this.sent_coords_index=Math.max(this.coords.length-1,0);return[this.x,this.y,this.stroke_color,this.line_width,Utility.array_to_string(this.coords),this.id];}}
register_command(FreeDraw,Path);function Eraser(x,y,stroke_color,line_width,coords=[x,y],id=-1){Path.call(this,x,y,line_width,stroke_color,coords,id)
this.draw=function(ctx){ctx.save();ctx.strokeStyle=this.STROKE_COLOR;ctx.lineWidth=this.line_width;ctx.globalCompositeOperation="destination-out";ctx.beginPath();ctx.moveTo(x,y);for(let coord of this.coords){ctx.lineTo(coord[0],coord[1]);}
ctx.stroke();ctx.restore();};this.package=function(){this.sent_coords_index=Math.max(this.coords.length-1,0);return[this.x,this.y,this.STROKE_COLOR,this.line_width,Utility.array_to_string(this.coords),this.id];}}
register_command(Eraser,Path);function InterpolationManager(){var self=this;self.current_shape=null;self.current_transformation=null;self.current_command=null;self.first_time=true;self.send_inbetween_message_interval;self.onMouseDown=function(){self.send_inbetween_message_interval=setInterval(self.send_interval_update,100);};self.onMouseUp=function(){clearInterval(self.send_inbetween_message_interval);self.current_shape=null
self.current_transformation=null;self.current_command=null;self.first_time=true;};self.send_interval_update=function(){if(self.current_transformation!=null)self.current_command=self.current_transformation;else if(self.current_shape!=null)self.current_command=self.current_shape;else return;if(self.first_time){sendInbetweenCommand(DataManager.package(self.current_command));self.first_time=false;}else{sendInbetweenCommand(self.current_command.package_inbetween());}};self.update_current=function(current_shape,current_transformation){self.current_shape=current_shape;self.current_transformation=current_transformation;};}
var Utility={isInbetween:function(a,b,c,error_radius=2.0){return Math.min(b,c)-error_radius<a&&a<Math.max(b,c)+error_radius;},customIsPointInPath:function(mx,my,x1,y1,x2,y2,error_radius=4.0){if(!this.isInbetween(mx,x1,x2,error_radius))return false;if(Math.abs(x2-x1)<=0.001)return true;var m=(y2-y1)/(x2-x1);var b=y1-m*x1;var theoretical_y=m*mx+b;var difference=Math.abs(my-theoretical_y);var test=(difference<=error_radius)
return test;},distance:function(x1,y1,x2,y2){return Math.sqrt((y2-y1)*(y2-y1)+(x2-x1)*(x2-x1));},string_to_array:function(string){let arr=[];for(let pair of string.split(';')){let sub_arr=pair.split(',');if(sub_arr.length>1)arr.push(sub_arr);}
return arr;},array_to_string:function(arr){let string=''
for(let item of arr){let addition=item[0]+','+item[1]+';';string+=addition;}
return string;}}
function Camera(r_width,r_height){this.r_width=r_width;this.r_height=r_height;this.ctx=null;this.v_width=r_width;this.v_height=r_height;this.x=0;this.y=0;this.x_offset=0;this.y_offset=0;this.scaled_x_offset=0;this.scaled_y_offset=0;this.transform_only_x=0;this.transform_only_y=0;this.scale=1;this.SCALE_FACTOR=2;this.scale_factor_exponent=0;this.translate_canvas=function(sx,sy,ex,ey){let dx=-(ex-sx)/this.scale;let dy=-(ey-sy)/this.scale;let old_x=this.x;let old_y=this.y;this.x+=dx;this.y+=dy;if(this.x>=1600){dx=1600-old_x;this.x=1600}
else if(this.x<=-1600){dx=-1600-old_x;this.x=-1600};if(this.y>=900){dy=900-old_y;this.y=900}
else if(this.y<=-900){dy=-900-old_y;this.y=-900};this.ctx.translate(-dx,-dy);this.transform_only_x=this.x;this.transform_only_y=this.y;}
this.zoom_canvas=function(exponent_delta,cx=null,cy=null){this.undo_current_zoom();if(cx==null&&cy==null)[cx,cy]=this.get_canvas_center();this.set_scale(exponent_delta);this.x_offset=(cx-this.x);this.y_offset=(cy-this.y);this.scaled_x_offset=cx-((cx-this.x)/this.scale);this.scaled_y_offset=cy-((cy-this.y)/this.scale);this.x=this.scaled_x_offset;this.y=this.scaled_y_offset;console.log(this.scaled_x_offset,this.x);if(this.x>=1600){this.x=1600;dx=0}
else if(this.x<=-1600){this.x=-1600;dx=0};if(this.y>=900){this.y=900;dy=0}
else if(this.y<=-900){this.y=-900;dy=0};this.ctx.translate(this.x_offset,this.y_offset);this.ctx.scale(this.scale,this.scale);this.ctx.translate(-this.x_offset,-this.y_offset);}
this.undo_current_zoom=function(){this.ctx.translate(this.x_offset,this.y_offset);this.ctx.scale(1/this.scale,1/this.scale);this.ctx.translate(-this.x_offset,-this.y_offset);this.x=this.transform_only_x;this.y=this.transform_only_y;this.v_width=r_width;this.v_height=r_height;this.scale=1;}
this.set_scale=function(exponent_delta){this.scale_factor_exponent+=exponent_delta;this.scale=Math.pow(this.SCALE_FACTOR,this.scale_factor_exponent);this.v_width=this.r_width/this.scale;this.v_height=this.r_height/this.scale;}
this.translate_mouse_coords=function(mx,my){return[mx+this.x,my+this.y];}
this.untranslate_mouse_coords=function(mx,my){return[mx-this.x,my-this.y];}
this.get_canvas_center=function(){return[this.x+this.v_width/2,this.y+this.v_height/2];}}
function CartesianPlaneBackground(){this.BASE_WIDTH=2;this.MULTIPLIER=2;this.TIP_LENGTH=30;this.SPACE=30;this.INTERVAL=5;this.MAJOR_LINE=this.SPACE*this.INTERVAL;this.p_canvas=document.createElement('canvas');this.p_canvas.width=1600;this.p_canvas.height=900;this.p_ctx=this.p_canvas.getContext('2d')
this.previous_cx=10;this.previous_cy=10;this.render=function(ctx,mapx,mapy,w,h,cx,cy){if(this.previous_cx!=cx||this.previous_cy!=cy){this.draw_to_p_canvas(mapx,mapy,w,h,cx,cy);this.previous_cx=cx;this.previous_cy=cy;}
console.log('drawing!')
ctx.drawImage(this.p_canvas,0,0);}
this.draw_to_p_canvas=function(mapx,mapy,w,h,cx,cy){this.p_ctx.clearRect(0,0,1600,900);this.p_ctx.translate(-cx+w/2,-cy+h/2);this.draw_major_axes(this.p_ctx,w,h);this.draw_minor_lines(this.p_ctx,mapx/2,mapy/2);this.draw_major_lines(this.p_ctx,mapx/2,mapy/2);this.p_ctx.translate(cx-w/2,cy-h/2);}
this.draw_major_axes=function(ctx,w,h){let x=w*3/2;let y=h*3/2;ctx.beginPath();ctx.lineWidth=this.BASE_WIDTH*this.MULTIPLIER+2;this.draw_arrow(ctx,0,0,x,0);this.draw_arrow(ctx,0,0,-x,0);this.draw_arrow(ctx,0,0,0,y);this.draw_arrow(ctx,0,0,0,-y);ctx.stroke();}
this.draw_arrow=function(ctx,sx,sy,ex,ey){theta=Math.atan2(ey-sy,ey-sy);ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.lineTo(ex-this.TIP_LENGTH*Math.cos(theta-Math.PI/6),ey-this.TIP_LENGTH*Math.sin(theta-Math.PI/6));ctx.lineTo(ex,ey);ctx.lineTo(ex-this.TIP_LENGTH*Math.cos(theta+Math.PI/6),ey-this.TIP_LENGTH*Math.sin(theta+Math.PI/6));}
this.draw_major_lines=function(ctx,h_mapx,h_mapy){ctx.beginPath();ctx.lineWidth=this.BASE_WIDTH*this.MULTIPLIER;ctx.globalAlpha=0.5;this.draw_major_x_lines(ctx,h_mapx,h_mapy);this.draw_major_y_lines(ctx,h_mapx,h_mapy);ctx.stroke();ctx.globalAlpha=1;}
this.draw_major_x_lines=function(ctx,h_mapx,h_mapy){for(let x=-h_mapx;x<=h_mapx;x+=this.MAJOR_LINE){ctx.moveTo(x,h_mapy);ctx.lineTo(x,-h_mapy);}}
this.draw_major_y_lines=function(ctx,h_mapx,h_mapy){for(let y=-h_mapy;y<=h_mapy;y+=this.MAJOR_LINE){ctx.moveTo(-h_mapx,y);ctx.lineTo(h_mapx,y);}}
this.draw_minor_lines=function(ctx,h_mapx,h_mapy){ctx.beginPath();ctx.lineWidth=this.BASE_WIDTH;ctx.globalAlpha=0.16;this.draw_minor_x_lines(ctx,h_mapx,h_mapy);this.draw_minor_y_lines(ctx,h_mapx,h_mapy);ctx.stroke();ctx.globalAlpha=1;}
this.draw_minor_y_lines=function(ctx,h_mapx,h_mapy){for(let x=-h_mapx;x<=h_mapx;x+=this.SPACE){if(x%this.MAJOR_LINE!=0){ctx.moveTo(x,h_mapy);ctx.lineTo(x,-h_mapy);}}}
this.draw_minor_x_lines=function(ctx,h_mapx,h_mapy){for(let y=-h_mapy;y<=h_mapy;y+=this.SPACE){if(y%this.MAJOR_LINE!=0){ctx.moveTo(-h_mapx,y);ctx.lineTo(h_mapx,y);}}}}
function LayerManager(canvas,ctx,shape_manager,camera){this.canvas=canvas;this.ctx=ctx;this.mapx=4800;this.mapy=2700;this.shape_manager=shape_manager;this.camera=camera;this.background=new CartesianPlaneBackground();this.background_enabled=false;this.render=function(){this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);if(this.background_enabled){this.background.render(this.ctx,this.mapx,this.mapy,this.canvas.width,this.canvas.height,this.camera.x,this.camera.y);}
this.shape_manager.render();this.ctx.drawImage(this.shape_manager.canvas,0,0);}
this.download=function(scope){let canvas=document.createElement('canvas');switch(scope){case'viewport':canvas.width=1600;canvas.height=900;ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.strokeStyle='#ffffff';ctx.fillRect(0,0,this.canvas.width,this.canvas.height)
ctx.drawImage(this.canvas,0,0);break;case'canvas':canvas.width=1920;canvas.height=1080;ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.strokeStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);let full_canvas=document.createElement('canvas')
full_canvas.width=this.mapx;full_canvas.height=this.mapy;let full_ctx=full_canvas.getContext('2d');full_ctx.translate(1600,900);for(let shape of this.shape_manager.shapes){shape.draw(full_ctx);}
ctx.scale(canvas.width/this.mapx,canvas.height/this.mapy);ctx.drawImage(full_canvas,0,0)
ctx.scale(this.mapx/canvas.width,this.mapy/canvas.height);break;default:alert('Something went wrong with the download!')
break;}
return canvas.toDataURL('image/png').replace("image/png","image/octet-stream");}}
function Page(){this.shapes=[];this.command_history=[];this.undo_history=[];this.pending_commands=[];this.inbetween_commands=[];this.pending_clear=false;this.pending_undo=[];this.get_all=function(){return[this.shapes,this.command_history,this.undo_history,this.pending_commands,this.inbetween_commands,this.pending_clear,this.pending_undo];}}
function PageManager(){this.curr_page_display=document.getElementById('current-page-indicator');this.max_page_display=document.getElementById('max-page-indicator');this.pages=[new Page()];this.curr_page=0;this.add_page=function(){this.pages.push(new Page());this.max_page_display.innerHTML=this.pages.length;}
this.get_current_page=function(){return this.pages[this.curr_page];}
this.set_page=function(page){if(page==this.pages.length)this.add_page();if(page<this.pages.length&&page>=0)this.curr_page=page;else throw"Invalid Page Number"
this.curr_page_display.value=this.curr_page+1;return this.get_current_page().get_all();}}
function md5cycle(x,k){var a=x[0],b=x[1],c=x[2],d=x[3];a=ff(a,b,c,d,k[0],7,-680876936);d=ff(d,a,b,c,k[1],12,-389564586);c=ff(c,d,a,b,k[2],17,606105819);b=ff(b,c,d,a,k[3],22,-1044525330);a=ff(a,b,c,d,k[4],7,-176418897);d=ff(d,a,b,c,k[5],12,1200080426);c=ff(c,d,a,b,k[6],17,-1473231341);b=ff(b,c,d,a,k[7],22,-45705983);a=ff(a,b,c,d,k[8],7,1770035416);d=ff(d,a,b,c,k[9],12,-1958414417);c=ff(c,d,a,b,k[10],17,-42063);b=ff(b,c,d,a,k[11],22,-1990404162);a=ff(a,b,c,d,k[12],7,1804603682);d=ff(d,a,b,c,k[13],12,-40341101);c=ff(c,d,a,b,k[14],17,-1502002290);b=ff(b,c,d,a,k[15],22,1236535329);a=gg(a,b,c,d,k[1],5,-165796510);d=gg(d,a,b,c,k[6],9,-1069501632);c=gg(c,d,a,b,k[11],14,643717713);b=gg(b,c,d,a,k[0],20,-373897302);a=gg(a,b,c,d,k[5],5,-701558691);d=gg(d,a,b,c,k[10],9,38016083);c=gg(c,d,a,b,k[15],14,-660478335);b=gg(b,c,d,a,k[4],20,-405537848);a=gg(a,b,c,d,k[9],5,568446438);d=gg(d,a,b,c,k[14],9,-1019803690);c=gg(c,d,a,b,k[3],14,-187363961);b=gg(b,c,d,a,k[8],20,1163531501);a=gg(a,b,c,d,k[13],5,-1444681467);d=gg(d,a,b,c,k[2],9,-51403784);c=gg(c,d,a,b,k[7],14,1735328473);b=gg(b,c,d,a,k[12],20,-1926607734);a=hh(a,b,c,d,k[5],4,-378558);d=hh(d,a,b,c,k[8],11,-2022574463);c=hh(c,d,a,b,k[11],16,1839030562);b=hh(b,c,d,a,k[14],23,-35309556);a=hh(a,b,c,d,k[1],4,-1530992060);d=hh(d,a,b,c,k[4],11,1272893353);c=hh(c,d,a,b,k[7],16,-155497632);b=hh(b,c,d,a,k[10],23,-1094730640);a=hh(a,b,c,d,k[13],4,681279174);d=hh(d,a,b,c,k[0],11,-358537222);c=hh(c,d,a,b,k[3],16,-722521979);b=hh(b,c,d,a,k[6],23,76029189);a=hh(a,b,c,d,k[9],4,-640364487);d=hh(d,a,b,c,k[12],11,-421815835);c=hh(c,d,a,b,k[15],16,530742520);b=hh(b,c,d,a,k[2],23,-995338651);a=ii(a,b,c,d,k[0],6,-198630844);d=ii(d,a,b,c,k[7],10,1126891415);c=ii(c,d,a,b,k[14],15,-1416354905);b=ii(b,c,d,a,k[5],21,-57434055);a=ii(a,b,c,d,k[12],6,1700485571);d=ii(d,a,b,c,k[3],10,-1894986606);c=ii(c,d,a,b,k[10],15,-1051523);b=ii(b,c,d,a,k[1],21,-2054922799);a=ii(a,b,c,d,k[8],6,1873313359);d=ii(d,a,b,c,k[15],10,-30611744);c=ii(c,d,a,b,k[6],15,-1560198380);b=ii(b,c,d,a,k[13],21,1309151649);a=ii(a,b,c,d,k[4],6,-145523070);d=ii(d,a,b,c,k[11],10,-1120210379);c=ii(c,d,a,b,k[2],15,718787259);b=ii(b,c,d,a,k[9],21,-343485551);x[0]=add32(a,x[0]);x[1]=add32(b,x[1]);x[2]=add32(c,x[2]);x[3]=add32(d,x[3]);}
function cmn(q,a,b,x,s,t){a=add32(add32(a,q),add32(x,t));return add32((a<<s)|(a>>>(32-s)),b);}
function ff(a,b,c,d,x,s,t){return cmn((b&c)|((~b)&d),a,b,x,s,t);}
function gg(a,b,c,d,x,s,t){return cmn((b&d)|(c&(~d)),a,b,x,s,t);}
function hh(a,b,c,d,x,s,t){return cmn(b^c^d,a,b,x,s,t);}
function ii(a,b,c,d,x,s,t){return cmn(c^(b|(~d)),a,b,x,s,t);}
function md51(s){txt='';var n=s.length,state=[1732584193,-271733879,-1732584194,271733878],i;for(i=64;i<=s.length;i+=64){md5cycle(state,md5blk(s.substring(i-64,i)));}
s=s.substring(i-64);var tail=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];for(i=0;i<s.length;i++)
tail[i>>2]|=s.charCodeAt(i)<<((i%4)<<3);tail[i>>2]|=0x80<<((i%4)<<3);if(i>55){md5cycle(state,tail);for(i=0;i<16;i++)tail[i]=0;}
tail[14]=n*8;md5cycle(state,tail);return state;}
function md5blk(s){var md5blks=[],i;for(i=0;i<64;i+=4){md5blks[i>>2]=s.charCodeAt(i)
+(s.charCodeAt(i+1)<<8)
+(s.charCodeAt(i+2)<<16)
+(s.charCodeAt(i+3)<<24);}
return md5blks;}
var hex_chr='0123456789abcdef'.split('');function rhex(n)
{var s='',j=0;for(;j<4;j++)
s+=hex_chr[(n>>(j*8+4))&0x0F]
+hex_chr[(n>>(j*8))&0x0F];return s;}
function hex(x){for(var i=0;i<x.length;i++)
x[i]=rhex(x[i]);return x.join('');}
function md5(s,length=16){hash_str=hex(md51(s));hash_str=hash_str.substring(0,16);return hash_str}
function add32(a,b){return(a+b)&0xFFFFFFFF;}
if(md5('hello')!='5d41402abc4b2a76b9719d911017c592'){function add32(x,y){var lsw=(x&0xFFFF)+(y&0xFFFF),msw=(x>>16)+(y>>16)+(lsw>>16);return(msw<<16)|(lsw&0xFFFF);}}
function hex_string_to_byte_array(hexByteString){var bytes=new Array(8);for(var i=0;i<hexByteString.length;){var hexByte=hexByteString[i++]+hexByteString[i++];var byte=parseInt(hexByte,16);bytes[i/2-1]=byte;}
return bytes;}
function byte_array_to_hex_string(byteArray){return Array.from(byteArray,function(byte){return('0'+(byte&0xFF).toString(16)).slice(-2);}).join('')}
function ChatManager(){let self=this;document.getElementById('chat-input').addEventListener('keypress',function(e){if(e.keyCode==13){e.preventDefault();self.onEnter();}});this.counter=0;this.expansion_bubble=document.getElementById('chat-bubble-container');this.expansion_bubble.addEventListener('mousedown',function(e){e.preventDefault();if(e.button==0)self.toggle_display();});this.chat_box_closer=document.getElementById('chat-box-closer');this.chat_box_closer.addEventListener('mousedown',function(e){e.preventDefault();self.toggle_display();});this.content_area=document.getElementById('chat-content');this.chat_box=document.getElementById('chat-box-container');this.previous_message_is_broadcast=false;this.unread_messages=0;this.unread_messages_display=document.getElementById('chat-unread-message-display');this.update_unread_messages_decorator=function(func){return function(){let is_scrolled_to_bottom=this.content_area.scrollHeight-this.content_area.clientHeight<=this.content_area.scrollTop+2;let result=func.apply(this,arguments);if(is_scrolled_to_bottom)this.content_area.scrollTop=this.content_area.scrollHeight;this.set_unread_messages(this.unread_messages+1);return result;}}
this.on_new_message=function(data){let user_id=data[0];let message=data[1];let username=user_manager.get_username(user_id);let previous_user_id=this.get_user_id_from_previous_bubble();if(!this.previous_message_is_broadcast&&previous_user_id==user_id){let bubble=this.get_previous_message_bubble();let bubble_addon=this.generate_bubble_addon(message);for(let element of bubble_addon){bubble.appendChild(element);}
}else{let elements=null
if(user_id==user_manager.USER_ID){console.log('self')
elements=this.generate_bubble_from_me(user_id,message);}else{console.log('other')
elements=this.generate_bubble_from_them(username,user_id,message);}
for(let element of elements){this.content_area.appendChild(element);}
this.previous_message_is_broadcast=false;}};this.on_new_message=this.update_unread_messages_decorator(this.on_new_message);this.generate_bubble_from_me=function(user_id,message){let clear_div=document.createElement('div');clear_div.className='chat-content-div clear';let text_div=document.createElement('div');text_div.className='chat-content-div from-me';let p_name=document.createElement('p');p_name.className='text-muted no-margin';p_name.setAttribute('data-user_id',user_id);p_name.innerHTML='You';let p_message=document.createElement('p');p_message.innerHTML=message;text_div.appendChild(p_name);text_div.appendChild(p_message);return[clear_div,text_div];}
this.generate_bubble_from_them=function(username,user_id,message){let clear_div=document.createElement('div');clear_div.className='chat-content-div clear';let text_div=document.createElement('div');text_div.className='chat-content-div from-them';let p_name=document.createElement('p');p_name.className='text-muted no-margin';p_name.setAttribute('data-user_id',user_id);p_name.innerHTML=username;let p_message=document.createElement('p');p_message.innerHTML=message;text_div.appendChild(p_name);text_div.appendChild(p_message);return[clear_div,text_div];}
this.generate_bubble_addon=function(message){let hr=document.createElement('hr');hr.className='small-margin';let p=document.createElement('p');p.innerHTML=message;return[hr,p];}
this.generate_status_message=function(username,status){let clear_div=document.createElement('div');clear_div.className='chat-content-div clear';let p=document.createElement('p');p.className='broadcast';if(status=='connecting')p.innerHTML=username+' has joined the room!';else if(status=='disconnecting')p.innerHTML=username+' has left the room!';else p.innerHTML='Oops, an error occured';return[clear_div,p];}
this.get_previous_message_bubble=function(){let elements=document.querySelectorAll('div.chat-content-div:not(.clear)');return elements[elements.length-1];}
this.get_user_id_from_bubble=function(bubble){if(bubble!=null){console.log()
return bubble.getElementsByClassName('text-muted')[0].getAttribute('data-user_id');}else{return null}}
this.get_user_id_from_previous_bubble=function(){return this.get_user_id_from_bubble(this.get_previous_message_bubble());}
this.onEnter=function(){let element=document.getElementById('chat-input');let message=element.value;if(message!=""&&message!=null){element.value=null
sendMessage(message);}}
this.toggle_display=function(){this.counter=(this.counter+1)%2
if(this.counter==0){this.chat_box.classList.add('hidden');this.expansion_bubble.classList.remove('hidden');}else{this.chat_box.classList.remove('hidden');this.expansion_bubble.classList.add('hidden');}
this.set_unread_messages(0);}
this.set_unread_messages=function(num){this.unread_messages=num;this.unread_messages_display.innerHTML=this.unread_messages;if(this.unread_messages==0)this.unread_messages_display.classList.add('hidden');else this.unread_messages_display.classList.remove('hidden');}
this.on_user_connect=function(data){let elements=this.generate_status_message(data[1],'connecting');for(let element of elements){this.content_area.appendChild(element);}
this.previous_message_is_broadcast=true;}
this.on_user_connect=this.update_unread_messages_decorator(this.on_user_connect);this.on_user_disconnect=function(user_id){let elements=this.generate_status_message(user_manager.get_username(user_id),'disconnecting');for(let element of elements){this.content_area.appendChild(element);}
this.previous_message_is_broadcast=true;}
this.on_user_disconnect=this.update_unread_messages_decorator(this.on_user_disconnect);}
function UserManager(){this.USER_ID=document.getElementById('room-data').getAttribute('data-user_id');this.USERNAME=document.getElementById('room-data').getAttribute('data-username');this.connected_users={}
this.connect_user=function(data){this.connected_users[data[0]]=data[1]}
this.disconnect_user=function(user_id){delete this.connected_users[user_id];}
this.get_username=function(user_id){return this.connected_users[user_id]||null;}}