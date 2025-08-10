import { useParams } from "react-router-dom";
import Notes from "./Notes";

function NotesWrapper() {
  const { contactId } = useParams();
  return <Notes contactId={contactId} />;
}

export default NotesWrapper;
