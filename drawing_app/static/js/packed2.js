function ChatManager(){$('#chat-input').on('keyup',function(e){if(e.keyCode==13){e.preventDefault();this.onEnter();}});this.content_area=document.getElementById('chat-content');this.on_new_message=function(data){let user_id=data[0];let message=data[1];let username=user_manager.get_username(user_id);let previous_user_id=this.get_user_id_from_previous_bubble();if(previous_user_id==user_id){let bubble=this.get_previous_message_bubble();let bubble_addon=this.generate_bubble_addon(message);}else{let bubble=null
if(user_id==user_manager.user_id){bubble=this.generate_bubble_from_me(user_id,message);}else{bubble=this.generate_bubble_from_them(username,user_id,message);}}};this.generate_bubble_from_me=function(user_id,message){return`<div class="chat-content-div clear"></div><div class="chat-content-div from-me"><p class='text-muted'data-user_id='${user_id}'>You</p><p>${message}</p></div>`}
this.generate_bubble_from_them=function(username,user_id,message){return`<div class="chat-content-div clear"></div><div class="chat-content-div from-them"><p class='text-muted'data-user_id='${user_id}'>${username}</p><p>${message}</p></div>`}
this.generate_bubble_addon=function(message){return`<hr><p>${message}</p>`}
this.get_previous_message_bubble=function(){return document.getElementsByClassName('chat-content-div')[this.previous_message_bubble.length-1];}
this.get_user_id_from_bubble=function(bubble){return bubble.getElementsByClassName('text-muted')[0].getAttribute('data-user_id');}
this.get_user_id_from_previous_bubble=function(){return this.get_username_from_bubble(this.get_previous_message_bubble);}
this.onEnter=function(){let element=document.getElementById('chat-input');let message=element.value;element.value=null
sendMessage(message);}}
function UserManager(){this.connected_users={}
this.connect_user=function(data){this.connected_users[data[0]]=data[1]}
this.get_username=function(user_id){return this.connected_users[user_id]||null;}}