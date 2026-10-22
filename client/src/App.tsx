import { Lobby } from "./components/Lobby";
import { Table } from "./components/Table";
import { useStore } from "./store";

export function App() {
  const { room, toast } = useStore();
  return (
    <>
      {room ? <Table room={room} /> : <Lobby />}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
