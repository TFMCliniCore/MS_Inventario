const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de ms-inventario...');

  if (await prisma.categoria.count()) {
    console.log('Seed ya aplicado. Omitiendo.');
    return;
  }

  const [medicamentos, alimentos, accesorios, vacunas] = await Promise.all([
    prisma.categoria.create({
      data: { nombre: 'Medicamentos', descripcion: 'Fármacos y medicamentos veterinarios' },
    }),
    prisma.categoria.create({
      data: { nombre: 'Alimentos', descripcion: 'Alimentos y snacks para mascotas' },
    }),
    prisma.categoria.create({
      data: { nombre: 'Accesorios', descripcion: 'Collares, correas, juguetes, camas' },
    }),
    prisma.categoria.create({
      data: { nombre: 'Vacunas', descripcion: 'Vacunas y biológicos veterinarios' },
    }),
  ]);

  const productos = [
    {
      nombre: 'Amoxicilina 500mg',
      descripcion: 'Antibiótico de amplio espectro para uso veterinario',
      codigoInterno: 'MED-001',
      marca: 'Vetoquinol',
      fabricante: 'Vetoquinol SA',
      precioCompra: 8500,
      precioVenta: 15000,
      cantidadActual: 50,
      cantidadMinima: 10,
      cantidadMaxima: 200,
      categoriaId: medicamentos.id,
    },
    {
      nombre: 'Alimento Premium Perros Adultos 3kg',
      codigoBarras: '7702011234567',
      codigoInterno: 'ALI-001',
      marca: 'Royal Canin',
      fabricante: 'Royal Canin Colombia',
      precioCompra: 45000,
      precioVenta: 72000,
      cantidadActual: 30,
      cantidadMinima: 5,
      cantidadMaxima: 100,
      categoriaId: alimentos.id,
    },
    {
      nombre: 'Vacuna Antirrábica',
      codigoInterno: 'VAC-001',
      descripcion: 'Vacuna antirrábica monovalente',
      fabricante: 'Zoetis',
      precioCompra: 12000,
      precioVenta: 25000,
      cantidadActual: 20,
      cantidadMinima: 5,
      cantidadMaxima: 100,
      categoriaId: vacunas.id,
    },
    {
      nombre: 'Collar antipulgas talla M',
      codigoInterno: 'ACC-001',
      marca: 'Seresto',
      fabricante: 'Bayer',
      precioCompra: 35000,
      precioVenta: 58000,
      cantidadActual: 15,
      cantidadMinima: 3,
      categoriaId: accesorios.id,
    },
  ];

  await prisma.producto.createMany({ data: productos });

  console.log(`Categorías creadas: 4`);
  console.log(`Productos de ejemplo creados: ${productos.length}`);
  console.log('Seed de ms-inventario completado exitosamente.');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error('Error en seed:', e.message);
    await prisma.$disconnect();
    process.exit(1);
  });