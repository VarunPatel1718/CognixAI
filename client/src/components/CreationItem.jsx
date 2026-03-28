import React from "react";
import { useState } from "react";
import Markdown from "react-markdown";

const CreationItem = ({ item }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className="p-4 max-w-5xl text-sm cursor-pointer"
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "12px",
      }}
    >
      <div className="flex justify-between items-center gap-4">
        <div>
          <h2
            className="text-sm font-medium text-slate-200"
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "300px",
            }}
          >
            {item.prompt}
          </h2>
          <p
            className="text-slate-400"
            style={{ fontSize: "0.75rem" }}
          >
            {item.type} - {new Date(item.created_at).toLocaleDateString()}
          </p>
        </div>

        <button
          style={{
            background: "rgba(124,58,237,0.15)",
            border: "1px solid rgba(124,58,237,0.3)",
            color: "#a78bfa",
            fontSize: "0.7rem",
            padding: "2px 12px",
            borderRadius: "20px",
          }}
        >
          {item.type}
        </button>
      </div>
      {expanded && (
        <div>
          {(item.type === "image" ||
            item.type === "remove-background" ||
            item.type === "remove-object") ? (
            <div>
              <img
                src={item.content}
                alt="creation"
                className="mt-3 w-full max-w-md rounded-lg"
                onError={(e) => (e.target.style.display = "none")}
              />
            </div>
          ) : (
            <div
              className="mt-3 max-h-64 overflow-y-auto text-sm text-slate-300 leading-relaxed"
            >
              <div className="reset-tw">
                <Markdown>{item.content}</Markdown>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CreationItem;
