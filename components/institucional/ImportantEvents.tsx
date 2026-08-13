"use client";

import Banners from "./Banners";

interface ImportantEventsProps {
  banners: any[];
}

export default function ImportantEvents({ banners }: ImportantEventsProps) {
  return (
    <div className="row px-0 px-md-2 row-main">
      <div className="col-md-12" style={{ backgroundColor: "#4B5667", borderRadius: "10px" }}>
        <div className="mt-2 row">

          <div className="col-12 text-center">
            <h5 style={{ color: "#FFF" }}>
              <i className="fa-regular fa-calendar mr-2" style={{ fontSize: "14px" }} />
              <span style={{ fontWeight: 700, fontSize: "16px", lineHeight: "18px" }}>EVENTOS IMPORTANTES</span>
            </h5>
          </div>

          <div className="col-12 p-0 m-0" style={{ backgroundColor: "#D8DBE2", borderRadius: "10px", overflow: "hidden" }}>
            <Banners banners={banners} />
          </div>

        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1000px) {
          .row-main {
            padding-left: 41px;
            padding-right: 41px;
          }
        }
      `}</style>
    </div>
  );
}
