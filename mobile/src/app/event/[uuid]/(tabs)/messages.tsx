import { Redirect } from "expo-router";

import { useEvent } from "@/context/EventContext";

// Onglet « Messages » : un appui ouvre le chat (voir _layout.tsx).
// Cet écran n'est atteint que par un lien direct, qu'on renvoie au chat.
export default function MessagesTab() {
  const { uuid } = useEvent();

  return (
    <Redirect href={{ pathname: "/event/[uuid]/chat", params: { uuid } }} />
  );
}
