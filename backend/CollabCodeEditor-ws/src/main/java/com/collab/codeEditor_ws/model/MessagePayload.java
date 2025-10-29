package com.collab.codeEditor_ws.model;

public class MessagePayload {
    private String type;   // e.g., 'EDIT', 'CURSOR', 'PING'
    private String text;
    private String user;
    private String room;

    public MessagePayload(String type, String text, String user, String room) {
		super();
		this.type = type;
		this.text = text;
		this.user = user;
		this.room = room;
	}
    
    
	@Override
	public String toString() {
		return "MessagePayload [type=" + type + ", text=" + text + ", user=" + user + ", room=" + room + "]";
	}


	public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public String getUser() { return user; }
    public void setUser(String user) { this.user = user; }
    public String getRoom() { return room; }
    public void setRoom(String room) { this.room = room; }
}