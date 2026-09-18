import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import ButtonAddEvent from "../../components/AddEvents/ButtonAddEvent";
import CardEvents from "../../components/AddEvents/CardEvents";
import EventEmpty from "../../components/AddEvents/EventEmpty";
import Filter from "../../components/AddEvents/Filter";
import ModalAddEvent from "../../components/AddEvents/ModalAddEvent";
import NavBar from "../../components/NavBar/NavBar";
import Profil from "../../components/Profil/Profil";
import type { EventData, FilterType } from "../../types/Events";

import "./HomeEvents.css";

type User = {
  id: number;
};
function HomeEvents() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [activeFilter, setActiveFilter] = useState<FilterType>("ongoing");
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/auth/authVerif`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    fetch(`${import.meta.env.VITE_API_URL}/api/events?userId=${user.id}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch(console.error);
  }, [user?.id]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredEvents = events
    .filter((event) => {
      const endDate = new Date(event.event_date_end);
      if (activeFilter === "ongoing") return endDate >= today;
      if (activeFilter === "finished") return endDate < today;
      return true;
    })
    .sort((a, b) => {
      if (activeFilter === "finished") {
        return (
          new Date(b.event_date_end).getTime() -
          new Date(a.event_date_end).getTime()
        );
      }
      return (
        new Date(a.event_date_start).getTime() -
        new Date(b.event_date_start).getTime()
      );
    });

  const toast = Swal.mixin({
    toast: true,
    position: "top",
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
    customClass: { popup: "toast" },
  });

  const handleEventCreated = (newEvent: EventData) => {
    setEvents((prev) => [...prev, newEvent]);
    toast.fire({
      icon: "success",
      text: "Événement créé",
      customClass: { popup: "toast-error-popup" },
    });
  };
  const handleEventUpdated = (updatedEvent: EventData) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.event_id === updatedEvent.event_id ? updatedEvent : e,
      ),
    );
  };
  const handleEventDeleted = (deletedId: number) => {
    setEvents((prev) => prev.filter((ev) => ev.event_id !== deletedId));
  };

  return (
    <>
      <header className="HomeEvents-NavBar">
        <NavBar />
        <Profil />
      </header>
      <main className="HomeEvents-Global">
        <div className="HomeEvents-Title">
          <h1>Mes Evénements</h1>
        </div>
        <div className="HomeEvents-FilterAdd">
          <Filter
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
          <ButtonAddEvent onClick={() => setIsModalOpen(true)} />
        </div>
        <ul className="HomeEvents-CardGlobal">
          {filteredEvents.length === 0 ? (
            <EventEmpty />
          ) : (
            filteredEvents.map((event) => (
              <li key={event.event_id} className="HomeEvents-Card">
                <CardEvents
                  key={event.event_id}
                  user_id={user?.id ?? 0}
                  event_id={event.event_id}
                  event_uuid={event.event_uuid}
                  event_id_host={event.event_id_host}
                  image={event.event_picture}
                  imageAlt={event.event_name}
                  dateStart={event.event_date_start}
                  dateEnd={event.event_date_end}
                  title={event.event_name}
                  description={event.event_description}
                  location={event.event_location}
                  onEventDeleted={handleEventDeleted}
                  onEventUpdated={handleEventUpdated}
                />
              </li>
            ))
          )}
        </ul>
        <ModalAddEvent
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onEventCreated={handleEventCreated}
        />
      </main>
    </>
  );
}

export default HomeEvents;
