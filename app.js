class BarberShopScheduler {
  constructor() {
    this.setupLandingPage();
    this.currentDate = new Date();
    this.selectedDate = null;
    this.selectedTimeSlot = null;

    // Enhance the appointment loading with error handling
    try {
      this.appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      // Validate loaded data
      if (!Array.isArray(this.appointments)) {
        console.warn('Invalid appointments data format, resetting to empty array');
        this.appointments = [];
      }
    } catch (e) {
      console.error('Error loading appointments:', e);
      this.appointments = [];
    }

    // Clean up old appointments periodically (once per day)
    this.cleanUpOldAppointments();
    this.initializeElements();
    this.attachEventListeners();
    this.renderCalendar();
    this.renderAppointmentsList();
  }

  setupLandingPage() {
    const startButton = document.getElementById('startButton');
    const mainContent = document.getElementById('mainContent');
    
    startButton.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('landingPage').style.display = 'none';
      mainContent.classList.add('visible');
    });
  }

  initializeElements() {
    this.monthDisplay = document.getElementById('monthDisplay');
    this.calendar = document.getElementById('calendar');
    this.timeSlots = document.getElementById('timeSlotsContainer');
    this.appointmentForm = document.getElementById('appointmentForm');
    this.bookingForm = document.getElementById('bookingForm');
    this.appointmentsList = document.getElementById('appointmentsList');
  }

  attachEventListeners() {
    document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));
    
    this.bookingForm.addEventListener('submit', (e) => this.handleBookingSubmit(e));
  }

  changeMonth(delta) {
    this.currentDate.setMonth(this.currentDate.getMonth() + delta);
    this.renderCalendar();
  }

  renderCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    this.monthDisplay.textContent = new Date(year, month).toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric'
    });

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay();
    
    this.calendar.innerHTML = '';
    
    // Dias vazios no início
    for (let i = 0; i < startingDay; i++) {
      const dayElement = document.createElement('div');
      dayElement.classList.add('calendar-day', 'disabled');
      this.calendar.appendChild(dayElement);
    }
    
    // Dias do mês
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dayElement = document.createElement('div');
      dayElement.classList.add('calendar-day');
      dayElement.textContent = day;
      
      if (date.getDay() === 0) { // Domingo
        dayElement.classList.add('disabled');
      } else {
        dayElement.addEventListener('click', () => this.handleDateSelect(date));
        
        // Verificar se há agendamentos neste dia
        const hasAppointments = this.appointments.some(apt => {
          const aptDate = new Date(apt.datetime);
          return aptDate.getDate() === day && 
                 aptDate.getMonth() === month && 
                 aptDate.getFullYear() === year;
        });
        
        if (hasAppointments) {
          dayElement.classList.add('booked');
        }
      }
      
      this.calendar.appendChild(dayElement);
    }
  }

  handleDateSelect(date) {
    this.selectedDate = date;
    this.renderTimeSlots();
  }

  renderTimeSlots() {
    this.timeSlots.innerHTML = '';
    
    const workingHours = {
      start: 8, // 8:00
      end: 18   // 18:00
    };
    
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      for (let minutes of ['00', '30']) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minutes}`;
        const dateTime = new Date(this.selectedDate);
        dateTime.setHours(hour, parseInt(minutes));
        
        const isBooked = this.appointments.some(apt => {
          const aptDateTime = new Date(apt.datetime);
          return aptDateTime.getTime() === dateTime.getTime();
        });
        
        const timeSlot = document.createElement('div');
        timeSlot.classList.add('time-slot');
        timeSlot.textContent = timeString;
        
        // Verificar se este é o horário selecionado
        if (this.selectedTimeSlot && this.selectedTimeSlot.getTime() === dateTime.getTime()) {
          timeSlot.classList.add('selected');
        }
        
        if (isBooked) {
          timeSlot.classList.add('booked');
        } else {
          timeSlot.addEventListener('click', () => {
            // Remove a seleção do slot anterior
            const previousSelected = this.timeSlots.querySelector('.time-slot.selected');
            if (previousSelected) {
              previousSelected.classList.remove('selected');
            }
            
            // Adiciona a seleção ao novo slot
            timeSlot.classList.add('selected');
            this.handleTimeSelect(dateTime);
          });
        }
        
        this.timeSlots.appendChild(timeSlot);
      }
    }
  }

  handleTimeSelect(dateTime) {
    this.selectedTimeSlot = dateTime;
    this.appointmentForm.classList.remove('hidden');
    document.getElementById('selectedDateTime').value = dateTime.toISOString();
  }

  // Add new method to clean up old appointments
  cleanUpOldAppointments() {
    const lastCleanup = localStorage.getItem('lastCleanup');
    const now = new Date().getTime();
    
    // Run cleanup if it hasn't been done today
    if (!lastCleanup || (now - parseInt(lastCleanup)) > 86400000) { // 24 hours
      // Remove appointments older than 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      this.appointments = this.appointments.filter(apt => {
        return new Date(apt.datetime) > sixMonthsAgo;
      });
      
      this.saveAppointments();
      localStorage.setItem('lastCleanup', now.toString());
    }
  }

  // Add new method to handle storage
  saveAppointments() {
    try {
      localStorage.setItem('appointments', JSON.stringify(this.appointments));
    } catch (e) {
      console.error('Error saving appointments:', e);
      alert('Erro ao salvar o agendamento. Por favor, tente novamente.');
    }
  }

  handleBookingSubmit(e) {
    e.preventDefault();
    
    const selectedServices = Array.from(document.querySelectorAll('input[name="service"]:checked'))
      .map(checkbox => checkbox.value);
    
    if (selectedServices.length === 0) {
      document.getElementById('serviceError').classList.add('visible');
      return;
    }
    document.getElementById('serviceError').classList.remove('visible');
    
    const appointment = {
      datetime: document.getElementById('selectedDateTime').value,
      name: document.getElementById('clientName').value,
      phone: document.getElementById('clientPhone').value,
      services: selectedServices,
      createdAt: new Date().toISOString() // Add creation timestamp
    };
    
    try {
      this.appointments.push(appointment);
      this.saveAppointments();
      
      // Reset selection
      this.selectedTimeSlot = null;
      
      this.renderCalendar();
      this.renderTimeSlots();
      this.renderAppointmentsList();
      this.appointmentForm.classList.add('hidden');
      this.bookingForm.reset();
      
      alert('Agendamento realizado com sucesso!');
    } catch (e) {
      console.error('Error during booking:', e);
      alert('Erro ao realizar o agendamento. Por favor, tente novamente.');
    }
  }

  renderAppointmentsList() {
    this.appointmentsList.innerHTML = '';
    
    const currentDate = new Date();
    currentDate.setHours(23, 59, 59, 999); // End of current day
    
    try {
      const sortedAppointments = [...this.appointments]
        .filter(apt => new Date(apt.datetime) <= currentDate)
        .sort((a, b) => new Date(b.datetime) - new Date(a.datetime)); // Most recent first
      
      if (sortedAppointments.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.classList.add('empty-message');
        emptyMessage.textContent = 'Nenhum agendamento anterior encontrado.';
        this.appointmentsList.appendChild(emptyMessage);
        return;
      }
      
      sortedAppointments.forEach(apt => {
        const date = new Date(apt.datetime);
        const appointmentElement = document.createElement('div');
        appointmentElement.classList.add('appointment-item');
        appointmentElement.innerHTML = `
          <strong>${date.toLocaleDateString('pt-BR')}</strong> - 
          ${date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})} - 
          ${apt.name} (${apt.phone})<br>
          Serviços: ${apt.services.join(', ')}
        `;
        this.appointmentsList.appendChild(appointmentElement);
      });
    } catch (e) {
      console.error('Error rendering appointments list:', e);
      const errorMessage = document.createElement('div');
      errorMessage.classList.add('error-message', 'visible');
      errorMessage.textContent = 'Erro ao carregar o histórico de agendamentos.';
      this.appointmentsList.appendChild(errorMessage);
    }
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  new BarberShopScheduler();
  
  // Add storage event listener to sync across tabs
  window.addEventListener('storage', (e) => {
    if (e.key === 'appointments') {
      window.location.reload(); // Reload page to sync appointments
    }
  });
});
