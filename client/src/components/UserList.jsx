import React from "react";
import UserCard from "./UserCard";

const UserList = ({ complaints }) => (
  <div className="row">
    {complaints.length === 0 ? (
      <div className="col-12 text-center text-muted py-5">
        No complaints found.
      </div>
    ) : (
      complaints.map((complaint) => (
        <div className="col-md-6 col-lg-4 mb-4" key={complaint.id}>
          <UserCard complaint={complaint} />
        </div>
      ))
    )}
  </div>
);

export default UserList;