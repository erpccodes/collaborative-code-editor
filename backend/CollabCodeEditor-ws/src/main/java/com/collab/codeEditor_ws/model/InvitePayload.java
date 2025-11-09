package com.collab.codeEditor_ws.model;

public class InvitePayload {
    private String fromUser;
    private String toUser;

    public InvitePayload() {}

    public InvitePayload(String fromUser, String toUser) {
        this.fromUser = fromUser;
        this.toUser = toUser;
    }

    public String getFromUser() {
        return fromUser;
    }

    public void setFromUser(String fromUser) {
        this.fromUser = fromUser;
    }

    public String getToUser() {
        return toUser;
    }

    public void setToUser(String toUser) {
        this.toUser = toUser;
    }

    @Override
    public String toString() {
        return "InvitePayload{" +
                "fromUser='" + fromUser + '\'' +
                ", toUser='" + toUser + '\'' +
                '}';
    }
}
