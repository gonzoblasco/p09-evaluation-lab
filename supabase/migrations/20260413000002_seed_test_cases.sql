-- Seed: test cases reales de SoporteML
-- Categorías: garantía, envío, devoluciones

insert into test_cases (title, buyer_question, seller_context, expected_response, category) values

-- GARANTÍA
(
  'Cargador defectuoso a 2 días de uso',
  'Hola, compré el cargador hace dos días y ya dejó de funcionar. ¿Cómo reclamo la garantía?',
  'Producto: Cargador USB-C 65W Marca XPower. Garantía del fabricante: 12 meses por defectos de fabricación. El comprador recibió el producto hace 2 días. Política interna: aceptar cambio o reembolso con foto del defecto.',
  'Hola! Lamentamos el inconveniente. El cargador tiene 12 meses de garantía por defectos de fabricación. Por favor envianos una foto del producto para verificar el defecto y gestionamos el cambio o reembolso de inmediato. ¡Nos ocupamos!',
  'garantía'
),
(
  'Producto dejó de funcionar a los 3 meses',
  'El ventilador que compré hace 3 meses dejó de andar. ¿Tiene garantía todavía?',
  'Producto: Ventilador de pie 16 pulgadas. Garantía: 6 meses por defectos de fabricación. El comprador recibió el producto hace exactamente 90 días. Estado del pedido: entregado y confirmado.',
  'Hola! Sí, el ventilador tiene 6 meses de garantía y tu compra tiene 3 meses, así que está cubierta. Abrí una reclamación por la plataforma con foto o video del inconveniente y coordinamos el retiro y reemplazo sin costo.',
  'garantía'
),
(
  'Vendedor no responde sobre garantía',
  'Mandé varios mensajes sobre la garantía de mi auricular y nadie me responde. ¿Qué hago?',
  'Producto: Auriculares Bluetooth TWS. Garantía: 3 meses. El comprador reportó el problema hace 5 días sin respuesta. El vendedor tuvo problemas técnicos internos esa semana.',
  'Hola! Pedimos disculpas por la demora en responder, tuvimos inconvenientes operativos. Tu reclamo de garantía está registrado. Por favor confirmanos el defecto que presenta el auricular y en menos de 24 horas coordinamos la solución.',
  'garantía'
),
(
  'Garantía por pantalla rota',
  'Se me cayó el teléfono y se rompió la pantalla. ¿La garantía cubre eso?',
  'Producto: Smartphone Gamer X12. Garantía: 12 meses por defectos de fabricación, no cubre daños físicos por caída. Política: derivar a servicio técnico autorizado para daños físicos.',
  'Hola! Lamentamos lo ocurrido. La garantía del fabricante cubre defectos de fabricación, pero las roturas por caída quedan fuera de cobertura. Te podemos derivar a un servicio técnico autorizado donde pueden cotizarte la reparación de pantalla con precio accesible. ¿Te interesa el dato?',
  'garantía'
),

-- ENVÍO
(
  'Pedido no llegó en la fecha prometida',
  'Tenían que entregarme el pedido ayer y todavía no llegó. ¿Qué pasó?',
  'Pedido #ML-88421. Fecha estimada de entrega: ayer. Estado en logística: en camino, demora por volumen de paquetes en el correo. Producto: silla ergonómica. Número de seguimiento: TR9921847AR.',
  'Hola! Lamentamos la demora. Consultamos con el correo y hay una demora generalizada por alto volumen de envíos. Tu número de seguimiento es TR9921847AR, podés rastrearlo en el sitio del correo. Estimamos que llega en las próximas 24-48 horas. Te avisamos en cuanto tengamos novedades.',
  'envío'
),
(
  'Tracking dice entregado pero no lo recibí',
  'El sistema dice que mi paquete fue entregado pero yo no recibí nada ni me dejaron aviso.',
  'Pedido #ML-77209. Estado: "Entregado" según el correo desde ayer 14:32 hs. Producto: teclado mecánico. Dirección de entrega: Av. Corrientes 1234, CABA. El correo reporta entrega en manos de persona en el domicilio.',
  'Hola! Entendemos tu preocupación. El sistema marca entrega, pero vamos a hacer la gestión con el correo para confirmar quién recibió el paquete. Por favor consultá con vecinos o portería por si lo recibieron. Si en 24 horas no aparece, abrimos una disputa y te reponemos el producto.',
  'envío'
),
(
  'Paquete llegó dañado por el transporte',
  'El paquete llegó todo aplastado y el producto adentro está roto. ¿Qué hago?',
  'Producto: Impresora multifunción. Pedido enviado con embalaje reforzado. El daño parece ser por maltrato en tránsito. Póliza de seguro de envío: activa para este pedido.',
  'Hola! Lamentamos mucho que el producto llegara en esas condiciones. Por favor sacá fotos del embalaje y del producto dañado. Con esas imágenes gestionamos el reclamo al seguro del envío y coordinamos el cambio del producto sin costo. No tenés que devolver nada todavía.',
  'envío'
),
(
  'Solicitud de cambio de dirección de entrega',
  'Me equivoqué de dirección al comprar. ¿Se puede cambiar antes de que salga?',
  'Pedido #ML-90033. Estado: preparando para envío (aún no despachado). Producto: monitor 27". La logística permite cambio de dirección hasta 2 horas antes del despacho.',
  'Hola! Buenas noticias, el pedido todavía no salió. Para hacer el cambio de dirección necesitamos que lo hagas directamente desde tu cuenta de ML en "Mis compras", o nos confirmás la nueva dirección completa (calle, número, piso, CP y ciudad) por este chat y lo actualizamos nosotros.',
  'envío'
),

-- DEVOLUCIONES
(
  'Devolución por arrepentimiento de compra',
  'Compré un vestido pero cuando llegó el color no era el que esperaba. ¿Puedo devolverlo?',
  'Producto: vestido talle M color "azul marino" según foto. El comprador dice que es más oscuro que en la imagen. La compra tiene 8 días. Política de devoluciones de ML: 30 días para devolución por arrepentimiento.',
  'Hola! Por supuesto. Tenés 30 días desde la compra para hacer la devolución por arrepentimiento, así que estás en tiempo. Iniciá la devolución desde tu cuenta en ML → "Mis compras" → "Devolver". El envío de vuelta es con etiqueta prepaga que te manda ML. Una vez que recibimos el producto, acreditamos el reembolso.',
  'devoluciones'
),
(
  'Producto equivocado recibido',
  'Compré un mouse inalámbrico negro y me mandaron uno con cable y de color blanco. Esto no es lo que pedí.',
  'Pedido #ML-65421. Producto correcto: Mouse Inalámbrico Negro M200. Producto enviado según el comprador: Mouse con cable Blanco M100. Probable error de picking en depósito.',
  'Hola! Pedimos disculpas, claramente hubo un error en el despacho. Necesitamos que nos mandes foto del producto recibido y del número de orden en la caja. Gestionamos el retiro del producto equivocado y el envío del mouse correcto sin costo adicional. No hace falta que inicies ninguna devolución vos.',
  'devoluciones'
),
(
  'Vendedor no acepta la devolución',
  'El vendedor me dice que no acepta devoluciones pero yo vi que ML lo obliga. ¿Qué hago?',
  'El vendedor indicó en la publicación "no acepta devoluciones" pero esto contradice la política de ML para productos nuevos. El comprador tiene 6 días desde la recepción. El producto está sin uso.',
  'Hola! Entendemos tu situación. La política de Mercado Libre garantiza el derecho de arrepentimiento en compras de productos nuevos por hasta 30 días, independientemente de lo que diga la publicación. Si el vendedor no coopera, podés escalar el caso a Mercado Libre directamente desde "Mis compras" → "Tuve un problema". ML puede obligar la devolución.',
  'devoluciones'
),
(
  'Devolución fuera del plazo de 30 días',
  'Quiero devolver unos auriculares que ya tienen 45 días. ¿Igual puedo?',
  'Producto: Auriculares Bluetooth. Compra realizada hace 45 días. Sin uso reportado. El plazo de arrepentimiento de ML es de 30 días. El producto tiene 3 meses de garantía por defectos de fabricación.',
  'Hola! El plazo de devolución por arrepentimiento de 30 días ya venció, por lo que no podríamos procesar esa devolución por ese motivo. Sin embargo, si el producto presenta algún defecto de funcionamiento, sí podés reclamar bajo garantía (3 meses). ¿El auricular tiene algún problema técnico que podamos evaluar?',
  'devoluciones'
);
