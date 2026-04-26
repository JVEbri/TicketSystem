import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TICKET_TEMPLATES = [
  { title: 'No puedo iniciar sesión', description: 'Al intentar entrar, me da error 500', priority: 'HIGH' },
  { title: 'Error al procesar pago con tarjeta', description: 'El pago con tarjeta de crédito falla constantemente', priority: 'URGENT' },
  { title: 'No llega el correo de verificación', description: 'Me he registrado pero no recibo el email de verificación', priority: 'MEDIUM' },
  { title: 'La app se cierra al abrir notificaciones', description: 'Cada vez que recibo una notificación y la abro, la app se cierra', priority: 'HIGH' },
  { title: 'Solicitud de nueva funcionalidad', description: 'Me gustaría poder exportar los datos a Excel', priority: 'LOW' },
  { title: 'Error de sincronización', description: 'Los datos no se sincronizan entre dispositivos', priority: 'HIGH' },
  { title: 'Problema con el diseño responsive', description: 'En móvil los botones se solapan', priority: 'MEDIUM' },
  { title: 'Solicitud de integración', description: 'Necesitamos integrarnos con Salesforce', priority: 'MEDIUM' },
  { title: 'No puedo cambiar mi contraseña', description: 'El formulario de cambio de contraseña da error', priority: 'HIGH' },
  { title: 'Rendimiento lento en dashboard', description: 'El dashboard tarda mucho en cargar', priority: 'MEDIUM' },
  { title: 'Error 404 en páginas antiguas', description: 'Los enlaces antiguos dan página no encontrada', priority: 'LOW' },
  { title: 'Problema con uploads de archivos', description: 'No puedo subir imágenes mayores de 1MB', priority: 'HIGH' },
  { title: 'Solicitud de dark mode', description: 'Los usuarios solicitan modo oscuro', priority: 'LOW' },
  { title: 'Bug en búsqueda de usuarios', description: 'La búsqueda no devuelve resultados correctos', priority: 'MEDIUM' },
  { title: 'Necesito permisos de administrador', description: 'Solicito acceso de administrador para mi cuenta', priority: 'MEDIUM' },
  { title: 'Error en informe mensual', description: 'El informe mensual no se genera correctamente', priority: 'HIGH' },
  { title: 'Problema con API REST', description: 'Los endpoints de la API devuelven errores CORS', priority: 'URGENT' },
  { title: 'Solicitud de backup manual', description: 'Necesito hacer un backup de la base de datos', priority: 'HIGH' },
  { title: 'No funciona el filtro de fechas', description: 'El filtro de fechas no aplica correctamente', priority: 'MEDIUM' },
  { title: 'Error en importación de CSV', description: 'Al importar archivos CSV grandes falla', priority: 'HIGH' },
  { title: 'Solicitud de autenticación 2FA', description: 'Necesitamos autenticación de dos factores', priority: 'HIGH' },
  { title: 'Bug en edición de perfil', description: 'No se guardan los cambios en el perfil', priority: 'MEDIUM' },
  { title: 'Problema con WebSocket', description: 'Las conexiones WebSocket se caen frecuentemente', priority: 'HIGH' },
  { title: 'Solicitud de API GraphQL', description: 'Queremos migrar a GraphQL', priority: 'LOW' },
  { title: 'Error en cálculos financieros', description: 'Los totales no cuadran en algunos reportes', priority: 'URGENT' },
  { title: 'Problema de timezone', description: 'Las fechas se muestran con zona horaria incorrecta', priority: 'MEDIUM' },
  { title: 'Solicitud de audit log', description: 'Necesitamos registrar todos los cambios', priority: 'MEDIUM' },
  { title: 'Bug en paginación', description: 'La paginación muestra resultados duplicados', priority: 'HIGH' },
  { title: 'Rendimiento de base de datos', description: 'Las consultas están tardando mucho', priority: 'HIGH' },
  { title: 'Problema con cache', description: 'Los datos en cache no se invalidan', priority: 'MEDIUM' },
  { title: 'Error en webhooks', description: 'Los webhooks no se envían correctamente', priority: 'HIGH' },
  { title: 'Solicitud de multi-idioma', description: 'Necesitamos soporte para español e inglés', priority: 'MEDIUM' },
  { title: 'Bug en表格排序', description: 'Sorting no funciona en la tabla de clientes', priority: 'LOW' },
  { title: 'Problema con imágenes retina', description: 'Las imágenes se ven borrosas en pantallas retina', priority: 'LOW' },
  { title: 'Solicitud de métricas personalizadas', description: 'Queremos crear dashboards con KPIs propios', priority: 'MEDIUM' },
  { title: 'Error de memoria en producción', description: 'El servidor agota memoria RAM', priority: 'URGENT' },
  { title: 'Bug en exportación PDF', description: 'Los PDFs exportados tienen formato incorrecto', priority: 'MEDIUM' },
  { title: 'Problema con rate limiting', description: 'El rate limiting bloquea peticiones válidas', priority: 'HIGH' },
  { title: 'Solicitud de sandbox', description: 'Necesitamos un entorno de pruebas', priority: 'MEDIUM' },
  { title: 'Error de integración con Slack', description: 'Las notificaciones a Slack no funcionan', priority: 'MEDIUM' },
];

const REPORTER_NAMES = ['Juan García', 'María López', 'Carlos Rodríguez', 'Ana Martínez', 'Pedro Sánchez', 'Laura Fernández', 'Diego Torres', 'Sofia Ruiz', 'Miguel Castro', 'Elena Navarro'];
const ORGANIZATIONS = ['TechCorp S.L.', 'Global Solutions', 'Innovatech', 'Digital Dynamics', 'DataFlow Inc.', 'CloudFirst', 'SmartSystems', null];

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

async function main() {
  console.log('🌱 Starting seed...');

  // Clean up existing data
  await prisma.ticket.deleteMany();
  await prisma.ticketCounter.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const bcrypt = await import('bcrypt');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@tickets.local',
      password: hashedPassword,
      displayName: 'Admin',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Initialize counter
  await prisma.ticketCounter.create({
    data: { id: 'main', value: 0 },
  });

  // Create tickets
  const statuses = [...STATUSES, ...STATUSES, ...STATUSES, ...STATUSES].slice(0, 40);
  const priorities = [...PRIORITIES, ...PRIORITIES].slice(0, 40);

  for (let i = 0; i < 40; i++) {
    const template = TICKET_TEMPLATES[i % TICKET_TEMPLATES.length];
    const status = statuses[i];
    const priority = priorities[i];
    const reporterName = REPORTER_NAMES[i % REPORTER_NAMES.length];
    const org = ORGANIZATIONS[i % ORGANIZATIONS.length];

    await prisma.ticket.create({
      data: {
        reference: i + 1,
        title: template.title,
        description: template.description,
        status: status as any,
        priority: priority as any,
        reporterUser: reporterName,
        reporterEmail: reporterName.toLowerCase().replace(' ', '.') + '@example.com',
        reporterOrg: org,
      },
    });
  }

  console.log('✅ Created 40 tickets');
  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });