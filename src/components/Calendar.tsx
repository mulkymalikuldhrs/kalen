import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { DragAndDropCalendar } from 'react-big-calendar/lib/DragAndDropCalendar';
import { Navbar, Nav } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Calendar.css';

const localizer = momentLocalizer(moment);

const CalendarComponent = () => {
  const [events, setEvents] = useState([
    {
      start: new Date('2024-03-01T10:00:00'),
      end: new Date('2024-03-01T12:00:00'),
      title: 'Event 1',
      color: 'blue',
    },
    {
      start: new Date('2024-03-02T14:00:00'),
      end: new Date('2024-03-02T16:00:00'),
      title: 'Event 2',
      color: 'red',
    },
  ]);

  const handleSelectSlot = ({ start, end }) => {
    const newEvent = {
      start,
      end,
      title: 'New Event',
      color: 'green',
    };
    setEvents([...events, newEvent]);
  };

  return (
    <div className="calendar-container">
      <Navbar bg="light" expand="lg">
        <Navbar.Brand>Calendar</Navbar.Brand>
        <Nav className="mr-auto">
          <Nav.Link href="#day">Day</Nav.Link>
          <Nav.Link href="#week">Week</Nav.Link>
          <Nav.Link href="#month">Month</Nav.Link>
        </Nav>
      </Navbar>
      <DragAndDropCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        onSelectSlot={handleSelectSlot}
        selectable
      />
    </div>
  );
};

export default CalendarComponent;