document.addEventListener('DOMContentLoaded', async function () {
    console.log('DEBUG: DOMContentLoaded fired');
    const token = localStorage.getItem('token');
    console.log('DEBUG: Token from localStorage:', token ? token.substring(0, 10) + '...' : 'null');
    const reservasList = document.getElementById('reservas');
    const noReservasMsg = document.getElementById('no-reservas');
    const reservaForm = document.getElementById('reserva-form');
    const logoutBtn = document.getElementById('logout-btn');
    const cantidadHabitacionesSelect = document.getElementById('cantidad_habitaciones');

    // FullCalendar variables
    let calendar;
    let selectedStartDate = null;
    let selectedEndDate = null;
    let minDisponibles = 4;
    let calendarData = { blockedDates: [], userEvents: [], maxHabitaciones: 4 };

    async function validateToken() {
        try {
            const response = await fetch('/api/reservas', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('DEBUG: Token validation response status:', response.status);
            return response.ok;
        } catch (err) {
            console.error('DEBUG: Token validation failed:', err);
            return false;
        }
    }

    if (!token || !(await validateToken())) {
        console.log('DEBUG: No token or invalid token, showing login message');
        noReservasMsg.textContent = 'Debes iniciar sesión para ver tus reservas y crear nuevas.';
        noReservasMsg.style.display = 'block';
        reservasList.style.display = 'none';
        if (reservaForm) reservaForm.style.display = 'none';
        alert('Sesión no iniciada o expirada. Redirigiendo al login.');
        window.location.href = '/iniciar_sesion';
        return;
    }

    if (reservaForm) reservaForm.style.display = 'block';

    // Fetch calendar events (blocked dates + user reservations)
    async function fetchCalendarEvents() {
        try {
            const response = await fetch('/api/reservas/calendario', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Error fetching calendar events');
            return await response.json();
        } catch (err) {
            console.error('DEBUG: Error fetching calendar events:', err);
            return { blockedDates: [], userEvents: [], maxHabitaciones: 4 };
        }
    }

    // Format date for input display (DD/MM/AAAA)
    function formatDateForInput(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // Check if a date is blocked (completely occupied)
    function isDateBlocked(dateStr) {
        const date = dateStr.split('T')[0];
        for (const blocked of calendarData.blockedDates) {
            if (blocked.start === date) {
                return true;
            }
        }
        return false;
    }

    // Calculate availability for a date range
    function calculateAvailabilityInRange(start, end) {
        const current = new Date(start);
        const endDate = new Date(end);
        let minDisponibles = calendarData.maxHabitaciones;
        
        while (current <= endDate) {
            const dateStr = current.toISOString().split('T')[0];
            
            // Calculate occupation for this specific date
            let ocupadas = 0;
            for (const event of calendarData.userEvents) {
                const eventStart = event.start;
                const eventEnd = event.end;
                if (dateStr >= eventStart && dateStr < eventEnd) {
                    if (event.extendedProps && event.extendedProps.habitaciones) {
                        ocupadas += event.extendedProps.habitaciones;
                    } else if (event.extendedProps && event.extendedProps.isMine) {
                        const match = event.title.match(/\((\d+)\s*hab/);
                        if (match) {
                            ocupadas += parseInt(match[1]);
                        }
                    }
                }
            }
            
            const disponibles = calendarData.maxHabitaciones - ocupadas;
            if (disponibles < minDisponibles) {
                minDisponibles = disponibles;
            }
            
            current.setDate(current.getDate() + 1);
        }
        
        return minDisponibles;
    }

    // Update room dropdown based on available rooms
    function updateRoomDropdown(maxRooms) {
        const select = document.getElementById('cantidad_habitaciones');
        if (!select) return;
        
        const currentValue = parseInt(select.value) || 1;
        
        // Enable the dropdown
        select.disabled = false;
        
        // Clear existing options
        select.innerHTML = '';
        
        // Add options based on max available rooms (1 to maxRooms)
        for (let i = 1; i <= maxRooms; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i === 1 ? '1 Habitación' : `${i} Habitaciones`;
            select.appendChild(option);
        }
        
        // Select the maximum available by default
        const selectValue = Math.min(currentValue, maxRooms);
        select.value = selectValue;
        
        // Update availability message
        const availabilityMsg = document.getElementById('availability-message');
        if (maxRooms < calendarData.maxHabitaciones) {
            availabilityMsg.textContent = `Disponibles: ${maxRooms} habitación${maxRooms > 1 ? 'es' : ''} para estas fechas`;
            availabilityMsg.className = 'text-sm text-amber-600 mt-2';
        } else {
            availabilityMsg.textContent = `Las ${calendarData.maxHabitaciones} habitaciones están disponibles`;
            availabilityMsg.className = 'text-sm text-green-600 mt-2';
        }
    }

    // Handle dropdown change with confirmation if too many rooms selected
    function handleHabitacionChange() {
        const select = document.getElementById('cantidad_habitaciones');
        if (!select || !selectedStartDate || !selectedEndDate) return;
        
        const selectedValue = parseInt(select.value);
        
        // Check if selected value exceeds available rooms
        if (selectedValue > minDisponibles) {
            const mensaje = `Solo hay ${minDisponibles} habitación${minDisponibles > 1 ? 'es' : ''} disponibles para las fechas seleccionadas. ¿Deseas continuar con ${minDisponibles}?`;
            const aceptar = confirm(mensaje);
            
            if (aceptar) {
                // Adjust to maximum available
                select.value = minDisponibles;
            } else {
                // Keep current selection (user chose to proceed with more than available)
                // But we should warn them at submit time
            }
        }
    }

    // Initialize FullCalendar
    async function initCalendar() {
        console.log('DEBUG: initCalendar started');
        calendarData = await fetchCalendarEvents();
        console.log('DEBUG: calendarData received:', calendarData);
        
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) {
            console.error('DEBUG: Calendar element not found');
            return;
        }
        
        // Show initial availability message
        const availabilityMsg = document.getElementById('availability-message');
        if (availabilityMsg) {
            availabilityMsg.textContent = 'Las 4 habitaciones están disponibles para todas las fechas';
            availabilityMsg.className = 'text-sm text-green-600 mt-2';
        }

        // Combine blocked dates and user events
        const allEvents = [
            ...calendarData.blockedDates,
            ...calendarData.userEvents
        ];

calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'es',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: ''
            },
            events: allEvents,
            selectable: true,
            selectMirror: true,
            select: function(selectInfo) {
                const start = selectInfo.start;
                const end = selectInfo.end;
                
                // Get the day before end (FullCalendar uses exclusive end)
                const endDate = new Date(end);
                endDate.setDate(endDate.getDate() - 1);
                
                // Minimum 2 nights
                const nights = Math.ceil((endDate - start) / (1000 * 60 * 60 * 24));
                if (nights < 2) {
                    alert('La reserva debe ser por al menos 2 noches.');
                    calendar.unselect();
                    return;
                }
                
                // Check for completely blocked dates in range
                const current = new Date(start);
                let blockedDatesList = [];
                
                while (current <= endDate) {
                    const dateStr = current.toISOString().split('T')[0];
                    
                    if (isDateBlocked(dateStr)) {
                        blockedDatesList.push(formatDateForInput(dateStr));
                    }
                    
                    current.setDate(current.getDate() + 1);
                }
                
                // If any day is completely blocked, reject
                if (blockedDatesList.length > 0) {
                    alert(`Las siguientes fechas no están disponibles: ${blockedDatesList.join(', ')}. Por favor, elige otras fechas.`);
                    calendar.unselect();
                    return;
                }
                
                // Calculate minimum availability in the selected range
                minDisponibles = calculateAvailabilityInRange(start, endDate);
                
                // Allow selection - use DD/MM/AAAA format for inputs
                selectedStartDate = start;
                selectedEndDate = endDate;
                
                const toInputFormat = (date) => {
                    const d = new Date(date);
                    const day = String(d.getDate()).padStart(2, '0');
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const year = d.getFullYear();
                    return `${day}/${month}/${year}`;
                };
                
                document.getElementById('fecha_check_in').value = toInputFormat(start);
                document.getElementById('fecha_check_out').value = toInputFormat(endDate);
                
                // Update room dropdown with available rooms
                updateRoomDropdown(minDisponibles);
                
                calendar.unselect();
            },
            events: allEvents,
            selectable: true,
            selectMirror: true,
            select: function(selectInfo) {
                const start = selectInfo.start;
                const end = selectInfo.end;
                
                // Get the day before end (FullCalendar uses exclusive end)
                const endDate = new Date(end);
                endDate.setDate(endDate.getDate() - 1);
                
                // Minimum 2 nights
                const nights = Math.ceil((endDate - start) / (1000 * 60 * 60 * 24));
                if (nights < 2) {
                    alert('La reserva debe ser por al menos 2 noches.');
                    calendar.unselect();
                    return;
                }
                
                // Check for completely blocked dates in range
                const current = new Date(start);
                let blockedDatesList = [];
                
                while (current <= endDate) {
                    const dateStr = current.toISOString().split('T')[0];
                    
                    if (isDateBlocked(dateStr)) {
                        blockedDatesList.push(formatDateForInput(dateStr));
                    }
                    
                    current.setDate(current.getDate() + 1);
                }
                
                // If any day is completely blocked, reject
                if (blockedDatesList.length > 0) {
                    alert(`Las siguientes fechas no están disponibles: ${blockedDatesList.join(', ')}. Por favor, elige otras fechas.`);
                    calendar.unselect();
                    return;
                }
                
                // Calculate minimum availability in the selected range
                minDisponibles = calculateAvailabilityInRange(start, endDate);
                
                // Allow selection
                selectedStartDate = start;
                selectedEndDate = endDate;
                
                document.getElementById('fecha_check_in').value = formatDateForInput(start.toISOString());
                document.getElementById('fecha_check_out').value = formatDateForInput(endDate.toISOString());
                
                // Update room dropdown with available rooms
                updateRoomDropdown(minDisponibles);
                
                calendar.unselect();
            },
            eventDidMount: function(info) {
                // Add tooltip and styles for different event types
                if (info.event.display === 'background') {
                    info.el.title = 'Fecha completamente ocupada - No disponible';
                    info.el.style.backgroundColor = '#ef4444';
                } else if (info.event.extendedProps && info.event.extendedProps.isMine) {
                    info.el.title = `Tu reserva: ${info.event.extendedProps.habitaciones} habitación(es)`;
                    info.el.classList.add('reserva-usuario');
                }
            },
            validRange: {
                start: new Date().toISOString().split('T')[0]
            },
            height: 'auto'
        });
        
        calendar.render();
    }

    // Handle logout
    if (logoutBtn) {
        console.log('DEBUG: Logout button found and listener attached');
        logoutBtn.addEventListener('click', function () {
            console.log('DEBUG: Logout initiated');
            localStorage.removeItem('token');
            alert('Has cerrado sesión exitosamente.');
            window.location.href = '/login';
        });
    } else {
        console.error('DEBUG: Logout button NOT found');
    }

    // Add event listener for habitacion dropdown
    if (cantidadHabitacionesSelect) {
        cantidadHabitacionesSelect.addEventListener('change', handleHabitacionChange);
    }
    
    // Add event listeners for date inputs
    const fechaCheckIn = document.getElementById('fecha_check_in');
    const fechaCheckOut = document.getElementById('fecha_check_out');
    
    // Parse DD/MM/AAAA to Date object
    function parseDMY(s) {
        const parts = s.split('/');
        if (parts.length !== 3) return null;
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const y = parseInt(parts[2], 10);
        if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900) return null;
        const date = new Date(y, m - 1, d);
        if (date.getMonth() !== m - 1 || date.getFullYear() !== y) return null;
        return date;
    }
    
    // Convert Date to YYYY-MM-DD
    function toISODate(date) {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${year}-${month}-${day}`;
    }
    
    function handleDateChange() {
        const checkIn = fechaCheckIn.value.trim();
        const checkOut = fechaCheckOut.value.trim();
        
        if (checkIn && checkOut) {
            // Validate DD/MM/AAAA format
            const start = parseDMY(checkIn);
            const end = parseDMY(checkOut);
            
            if (!start || !end) {
                alert('Formato de fecha inválido. Use DD/MM/AAAA');
                return;
            }
            
            // Check not in past
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (start < today) {
                alert('La fecha de entrada no puede ser anterior a hoy');
                fechaCheckIn.value = '';
                return;
            }
            
            // Minimum 2 nights
            const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            if (nights < 2) {
                alert('La reserva debe ser por al menos 2 noches.');
                return;
            }
            
            // Check for blocked dates
            let blockedDatesList = [];
            let current = new Date(start);
            
            while (current <= end) {
                const dateStr = toISODate(current);
                if (isDateBlocked(dateStr)) {
                    blockedDatesList.push(formatDateForInput(current.toISOString()));
                }
                current.setDate(current.getDate() + 1);
            }
            
            if (blockedDatesList.length > 0) {
                alert(`Las siguientes fechas no están disponibles: ${blockedDatesList.join(', ')}. Por favor, elige otras fechas.`);
                return;
            }
            
            // Calculate availability
            minDisponibles = calculateAvailabilityInRange(start, end);
            selectedStartDate = start;
            selectedEndDate = end;
            
            // Update dropdown
            updateRoomDropdown(minDisponibles);
        }
    }
    
    if (fechaCheckIn) {
        fechaCheckIn.addEventListener('change', handleDateChange);
    }
    if (fechaCheckOut) {
        fechaCheckOut.addEventListener('change', handleDateChange);
    }
    
    if (fechaCheckIn) {
        fechaCheckIn.addEventListener('change', handleDateChange);
    }
    if (fechaCheckOut) {
        fechaCheckOut.addEventListener('change', handleDateChange);
    }

    // Load user reservations
    try {
        const response = await fetch('/api/reservas', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                console.log('DEBUG: Unauthorized or Forbidden, redirecting to login');
                localStorage.removeItem('token');
                alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
                window.location.href = '/iniciar_sesion';
                return;
            }
            throw new Error('Error al obtener reservas');
        }

        const reservas = await response.json();

        if (reservas.length === 0) {
            noReservasMsg.style.display = 'block';
            reservasList.style.display = 'none';
        } else {
            noReservasMsg.style.display = 'none';
            reservasList.style.display = 'block';
            reservasList.innerHTML = '';

            reservas.forEach(reserva => {
                const li = document.createElement('li');

                const formatDate = (dateString) => {
                    if (!dateString) return '';
                    const parts = dateString.split('-');
                    return `${parts[2]}/${parts[1]}/${parts[0]}`;
                };

                const fechaIn = formatDate(reserva.fecha_check_in);
                const fechaOut = formatDate(reserva.fecha_check_out);

                li.textContent = `Tienes una reserva desde la fecha ${fechaIn} hasta la fecha ${fechaOut}`;

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Eliminar';
                deleteBtn.className = 'ml-3 px-3 py-1 rounded bg-red-500 text-white text-sm border-none cursor-pointer hover:bg-red-600 transition-all';
                
                deleteBtn.addEventListener('click', async () => {
                    if (confirm('¿Estás seguro de que deseas eliminar esta reserva?')) {
                        try {
                            const response = await fetch(`/api/reservas/${reserva.id}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            });

                            if (response.ok) {
                                alert('Reserva eliminada.');
                                li.remove();
                                if (reservasList.children.length === 0) {
                                    noReservasMsg.style.display = 'block';
                                    reservasList.style.display = 'none';
                                }
                                initCalendar();
                            } else {
                                alert('Error al eliminar la reserva.');
                            }
                        } catch (error) {
                            console.error('Error deleting reservation:', error);
                            alert('Error al eliminar la reserva.');
                        }
                    }
                });

                li.appendChild(deleteBtn);
                li.className = 'flex items-center py-3 px-4 bg-white rounded-lg shadow-sm';
                reservasList.appendChild(li);
            });
        }
    } catch (error) {
        console.error('DEBUG: Error fetching reservations:', error);
        noReservasMsg.textContent = 'Error al cargar reservas. Intenta de nuevo.';
        noReservasMsg.style.display = 'block';
        reservasList.style.display = 'none';
    }

    // Initialize calendar
    await initCalendar();

    // Form submission
    if (reservaForm) {
        reservaForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            console.log('DEBUG: Form submission triggered');

            const formData = new FormData(reservaForm);
            const checkInDate = document.getElementById('fecha_check_in').value;
            const checkOutDate = document.getElementById('fecha_check_out').value;

            if (!checkInDate || !checkOutDate) {
                alert('Por favor, selecciona las fechas en el calendario.');
                return;
            }

            // Final validation: check if selected rooms exceed availability
            const selectedHabitaciones = parseInt(formData.get('cantidad_habitaciones'));
            if (selectedHabitaciones > minDisponibles) {
                alert(`Solo hay ${minDisponibles} habitación${minDisponibles > 1 ? 'es' : ''} disponibles. Por favor, reduce la cantidad.`);
                return;
            }

            // Convert DD/MM/AAAA to YYYY-MM-DD for API
            const convertDateFormat = (dateStr) => {
                const parts = dateStr.trim().split('/');
                if (parts.length !== 3) {
                    throw new Error('Formato de fecha inválido. Use DD/MM/AAAA');
                }
                return `${parts[2]}-${parts[1]}-${parts[0]}`;
            };

            const reservaData = {
                fecha_check_in: convertDateFormat(checkInDate) + 'T00:00:00',
                fecha_check_out: convertDateFormat(checkOutDate) + 'T00:00:00',
                cantidad_habitaciones: selectedHabitaciones
            };

            console.log('DEBUG: Reservation data to send:', reservaData);

            try {
                const response = await fetch('/api/reservas', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(reservaData)
                });

                console.log('DEBUG: API response status:', response.status);

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('DEBUG: API error response:', errorData);
                    if (response.status === 401 || response.status === 403) {
                        localStorage.removeItem('token');
                        alert('Sesión expirada. Por favor, inicia sesión.');
                        window.location.href = '/iniciar_sesion';
                        return;
                    }
                    throw new Error(`Error: ${response.status} - ${errorData.detail || 'Error desconocido'}`);
                }

                const nuevaReserva = await response.json();
                console.log('DEBUG: New reservation created:', nuevaReserva);
                alert('Reserva enviada. Te contactaremos.');
                
                document.getElementById('fecha_check_in').value = '';
                document.getElementById('fecha_check_out').value = '';
                selectedStartDate = null;
                selectedEndDate = null;
                
                // Reset form
                document.getElementById('fecha_check_in').value = '';
                document.getElementById('fecha_check_out').value = '';
                selectedStartDate = null;
                selectedEndDate = null;
                
                // Reset dropdown to disabled
                const select = document.getElementById('cantidad_habitaciones');
                if (select) {
                    select.disabled = true;
                    select.innerHTML = '<option value="">Selecciona fechas primero</option>';
                }
                document.getElementById('availability-message').textContent = 'Selecciona fechas en el calendario para ver disponibilidad';
                document.getElementById('availability-message').className = 'text-sm text-[#6a6156] mt-2';
                
                location.reload();
            } catch (error) {
                console.error('DEBUG: Error creating reservation:', error);
                alert('Error al crear reserva: ' + error.message);
            }
        });
    } else {
        console.error('DEBUG: Reservation form not found');
    }
});
