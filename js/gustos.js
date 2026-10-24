/* LeeLEEJG · cada día: 2 preguntas sobre sus gustos (se le leen y elige con dibujos) y 1 adivinanza.
   La familia ve las respuestas en Evolución › Gustos y premios. */
'use strict';
const CARAS = [['¡Mucho!','e:😀'],['Un poco','e:🙂'],['No mucho','e:🙁']];
const GUSTOS = [
  ['leer','¿Te gusta leer?',CARAS],
  ['deporte','¿Qué deporte te gusta más?',[['Fútbol','balon'],['Baloncesto','baloncesto'],['Nadar','piscina'],['Bici','bici'],['Tenis','tenis'],['Esquí','esquis']]],
  ['mates','¿Te gustan las matemáticas?',CARAS],
  ['animal','¿Qué animal te gusta más?',[['Perro','perro'],['Gato','gato'],['León','leon'],['Delfín','delfin'],['Caballo','caballo'],['Pulpo','pulpo']]],
  ['comida','¿Cuál es tu comida favorita?',[['Pizza','pizza'],['Espaguetis','espaguetis'],['Empanada','empanada'],['Carne','carne'],['Pulpo','pulpo_feira'],['Sopa','sopa']]],
  ['mayor','¿Qué quieres ser de mayor?',[['Futbolista','balon'],['Astronauta','astronauta'],['Médico','hospital'],['Bombero','e:🚒'],['Profe','colegio'],['Cocinero','cocina']]],
  ['fruta','¿Qué fruta te gusta más?',[['Manzana','manzana'],['Plátano','platano'],['Fresa','fresa'],['Sandía','sandia'],['Naranja','naranja'],['Uvas','uvas']]],
  ['dibujar','¿Te gusta dibujar?',CARAS],
  ['recreo','¿Qué te gusta hacer en el recreo?',[['Correr','e:🏃'],['Jugar al fútbol','balon'],['Columpios','columpio'],['Hablar con amigos','e:🗣️']]],
  ['lugar','¿Qué prefieres?',[['La playa','playa'],['La montaña','montana'],['La piscina','piscina'],['El parque','parque']]],
  ['poder','¿Qué superpoder te gustaría tener?',[['Volar','e:🦸'],['Ser invisible','e:🫥'],['Súper fuerza','e:💪'],['Correr rapidísimo','e:⚡']]],
  ['color','¿Qué color te gusta más?',[['Rojo','e:🔴'],['Azul','e:🔵'],['Verde','e:🟢'],['Amarillo','e:🟡'],['Morado','e:🟣'],['Naranja','e:🟠']]],
  ['cantar','¿Te gusta cantar?',CARAS],
  ['musica','¿Qué instrumento te gustaría tocar?',[['Guitarra','guitarra'],['Piano','piano'],['Tambor','tambor'],['Gaita','gaita'],['Violín','violin'],['Trompeta','trompeta']]],
  ['jugar','¿Con quién te gusta jugar?',[['Con amigos','e:👫'],['Con papá y mamá','e:👨‍👩‍👦'],['Con mi perro','perro'],['Yo solo','e:🧒']]],
  ['juego','¿A qué te gusta jugar?',[['Escondite','e:🙈'],['Pilla-pilla','e:🏃'],['Puzles','puzle'],['Construcciones','e:🧱'],['Videojuegos','e:🎮'],['Pelota','pelota']]],
  ['estacion','¿Qué estación te gusta más?',[['Primavera','flor_primavera'],['Verano','sol'],['Otoño','otono'],['Invierno','nieve']]],
  ['cole','¿Qué es lo que más te gusta del cole?',[['Leer','libro'],['Los números','e:🔢'],['Dibujar','pinturas'],['El recreo','patio'],['La música','e:🎵'],['Gimnasia','balon']]],
  ['dino','¿Qué dinosaurio te gusta más?',[['T-Rex','trex'],['Diplodocus','diplodocus'],['Estegosaurio','estegosaurio'],['Pterodáctilo','pterodactilo'],['Velociraptor','velociraptor']]],
  ['viaje','¿En qué te gustaría viajar?',[['Avión','avion'],['Tren','tren'],['Barco','barco'],['Cohete','e:🚀'],['Globo','globo_aire'],['Bici','bici']]],
  ['cuentos','¿Te gustan los cuentos para dormir?',CARAS],
  ['aprender','¿Qué te gustaría aprender?',[['Nadar','piscina'],['Tocar la guitarra','guitarra'],['Otro idioma','e:🌍'],['Cocinar','cocina'],['Patinar','patines'],['Magia','e:🎩']]],
  ['mascota','¿Qué mascota te gustaría tener?',[['Perro','perro'],['Gato','gato'],['Hámster','hamster'],['Pez','pez'],['Tortuga','tortuga'],['Conejo','conejo']]],
  ['desayuno','¿Qué te gusta desayunar?',[['Leche','leche'],['Zumo','zumo'],['Galletas','galleta'],['Pan','pan'],['Churros','churros'],['Cereales','e:🥣']]],
  ['historias','¿De qué te gustan más las historias?',[['Animales','portada_animales'],['Dinosaurios','portada_dinos'],['Superhéroes','portada_heroes'],['Fútbol','portada_liga'],['El espacio','planeta'],['Canciones','portada_canciones']]],
  ['miedo','¿Qué te da un poco de miedo?',[['La oscuridad','noche'],['Las tormentas','rayo'],['Las arañas','arana'],['¡Nada!','e:💪']]],
  ['leerjuntos','¿Te gusta leer con papá o mamá?',CARAS],
  ['tele','¿Qué te gusta ver en la tele?',[['Dibujos','e:📺'],['Fútbol','estadio'],['Animales','e:🐾'],['Películas','e:🎬']]]
].map(([id,q,ops])=>({id,q,ops}));

/* [texto, opciones [etiqueta, foto], correcta, temporada] */
const ADIVINANZAS = [
  ['Tengo cuatro patas, ladro y muevo la cola. ¿Quién soy?',[['el perro','perro'],['el gato','gato'],['el pez','pez']],0],
  ['Soy redondo y amarillo, salgo por el día y doy calor. ¿Quién soy?',[['la luna','luna'],['el sol','sol'],['una nube','nubes']],1],
  ['Tengo una trompa larga y unas orejas enormes. ¿Quién soy?',[['la jirafa','jirafa'],['el ratón','raton'],['el elefante','elefante']],2],
  ['Tengo hojas pero no soy un árbol. Dentro tengo letras y cuentos. ¿Qué soy?',[['un libro','libro'],['una lechuga','lechuga'],['un árbol','arbol']],0],
  ['Vivo en el mar, tengo ocho patas y en la feria de Lugo me comen con pimentón. ¿Quién soy?',[['el cangrejo','cangrejo'],['el pulpo','pulpo'],['el tiburón','tiburon']],1],
  ['Me pones en la cabeza cuando montas en bici. ¿Qué soy?',[['la gorra','gorra'],['las gafas','gafas'],['el casco','casco']],2],
  ['Soy blanca y fría, caigo del cielo en invierno y conmigo haces muñecos. ¿Qué soy?',[['la nieve','nieve'],['la lluvia','lluvia'],['la arena','arena']],0],
  ['Tengo agujas pero no coso. Te digo la hora. ¿Qué soy?',[['el teléfono','telefono'],['el reloj','reloj'],['la lámpara','lampara']],1],
  ['Soy naranja y larga, y al conejo le encanto. ¿Qué soy?',[['el plátano','platano'],['el tomate','tomate'],['la zanahoria','zanahoria']],2],
  ['Hago miau y me encanta dormir al sol. ¿Quién soy?',[['el gato','gato'],['la vaca','vaca'],['el pato','pato']],0],
  ['Tengo el cuello muy largo y la piel con manchas. ¿Quién soy?',[['la cebra','cebra'],['la jirafa','jirafa'],['el oso','oso']],1],
  ['Llevo mi casa a cuestas y voy muy despacito. ¿Quién soy?',[['el perro','perro'],['el pez','pez'],['el caracol','caracol']],2],
  ['Me abres cuando llueve para no mojarte. ¿Qué soy?',[['el paraguas','paraguas'],['la sombrilla','sombrilla'],['la toalla','toalla']],0],
  ['Hago cua, cua y nado en el lago. ¿Quién soy?',[['la gallina','gallina'],['el pato','pato'],['la rana','rana']],1],
  ['Soy pequeña, vuelo de flor en flor y hago miel. ¿Quién soy?',[['la mariquita','mariquita'],['la hormiga','hormiga'],['la abeja','abeja']],2],
  ['Estoy muy frío, me comes con cuchara y tengo muchos sabores. ¿Qué soy?',[['el helado','helado'],['la sopa','sopa'],['el pan','pan']],0],
  ['Voy por las vías y hago chu, chu. ¿Qué soy?',[['el autobús','autobus'],['el tren','tren'],['el barco','barco']],1],
  ['Tengo siete colores y salgo cuando hay sol y lluvia. ¿Qué soy?',[['la estrella','estrellas'],['la luna','luna'],['el arcoíris','arcoiris']],2],
  ['Rujo muy fuerte y tengo una gran melena. ¿Quién soy?',[['el león','leon'],['el tigre','tigre'],['el mono','mono']],0],
  ['Fui un dinosaurio enorme, con dientes grandes y brazos cortitos. ¿Quién soy?',[['el diplodocus','diplodocus'],['el T-Rex','trex'],['el estegosaurio','estegosaurio']],1],
  ['Vuelo sin alas, me lleva el viento y me sujetas con una cuerda. ¿Qué soy?',[['el avión','avion'],['el pájaro','pajaro'],['la cometa','cometa']],2],
  ['En el campo hago muuu y doy leche. ¿Quién soy?',[['la vaca','vaca'],['la oveja','oveja'],['el caballo','caballo']],0],
  ['Soy un pájaro que no vuela, vivo en el hielo y camino así, así. ¿Quién soy?',[['la gaviota','gaviota'],['el pingüino','pinguino'],['el búho','buho']],1],
  ['Doy luz en la oscuridad y funciono con pilas. ¿Qué soy?',[['la vela','vela'],['el sol','sol'],['la linterna','linterna']],2],
  ['Tengo teclas blancas y negras y hago música. ¿Qué soy?',[['el piano','piano'],['la guitarra','guitarra'],['el tambor','tambor']],0],
  ['Vivo en el agua, tengo escamas y no tengo patas. ¿Quién soy?',[['la rana','rana'],['el pez','pez'],['el pato','pato']],1],
  ['Soy verde por fuera, roja por dentro y tengo pepitas negras. ¿Qué soy?',[['la manzana','manzana'],['la pera','pera'],['la sandía','sandia']],2],
  ['Tengo dos ruedas y pedales. ¿Qué soy?',[['la bici','bici'],['el coche','coche'],['el patinete','patinete']],0],
  ['Por la mañana canto quiquiriquí. ¿Quién soy?',[['la gallina','gallina'],['el gallo','gallo'],['el pollito','pollito']],1],
  ['Me lavas los dientes cada día. ¿Qué soy?',[['la cuchara','cuchara'],['el peine','cepillo'],['el cepillo de dientes','cepillo_dientes']],2],
  ['Soy naranja y redonda; en Samaín me ponen ojos y una vela dentro. ¿Qué soy?',[['la calabaza','calabaza'],['la naranja','naranja'],['el balón','balon']],0,'samain'],
  ['Duermo cabeza abajo y salgo de noche a volar. ¿Quién soy?',[['el búho','buho'],['el murciélago','murcielago'],['el gato','gato']],1,'samain'],
  ['De noche hago uh, uh y tengo los ojos muy grandes. ¿Quién soy?',[['el lobo','lobo'],['el gato','gato'],['el búho','buho']],2,'samain'],
  ['Tejo mi casa con hilos muy finos. ¿Quién soy?',[['la araña','arana'],['la hormiga','hormiga'],['la abeja','abeja']],0,'samain'],
  ['Por fuera tengo pinchos y me asan en la hoguera del Magosto. ¿Qué soy?',[['la bellota','bellota'],['la castaña','castanas'],['la nuez','e:🌰']],1,'magosto'],
  ['Tengo la cola peluda y guardo bellotas para el invierno. ¿Quién soy?',[['el ratón','raton'],['el conejo','conejo'],['la ardilla','ardilla']],2,'magosto'],
  ['Soy un árbol con bolas, luces y una estrella arriba. ¿Qué soy?',[['el árbol de Navidad','arbol_navidad'],['el pino del bosque','pina_pino'],['la palmera','e:🌴']],0,'navidad'],
  ['Me hacen de nieve y tengo nariz de zanahoria. ¿Quién soy?',[['el oso polar','oso_polar'],['el muñeco de nieve','nieve_muneco'],['el pingüino','pinguino']],1,'navidad'],
  ['Soy un bollo redondo con una corona y una sorpresa dentro. ¿Qué soy?',[['la tarta','tarta'],['la galleta','galleta'],['el roscón','roscon']],2,'navidad'],
  ['Te tapo la cara y nadie sabe quién eres. ¿Qué soy?',[['la máscara','mascara'],['la bufanda','bufanda'],['el sombrero','sombrero']],0,'entroido'],
  ['Me pones para ser pirata, león o astronauta. ¿Qué soy?',[['el pijama','pijama'],['el disfraz','disfraz'],['el abrigo','abrigo']],1,'entroido'],
  ['Tengo alas de colores y antes era un gusano. ¿Quién soy?',[['la abeja','abeja'],['el pájaro','pajaro'],['la mariposa','mariposa']],2,'primavera'],
  ['Me plantas en la tierra, me riegas y crezco. ¿Qué soy?',[['la semilla','semilla'],['la piedra','piedra'],['la llave','llave']],0,'primavera'],
  ['Soy un huevo pintado y me esconden en el jardín. ¿Qué soy?',[['el huevo de dinosaurio','huevo_dino'],['el huevo de Pascua','huevo_pascua'],['la pelota','pelota']],1,'pascua'],
  ['Tengo las orejas largas y salto mucho. ¿Quién soy?',[['el canguro','canguro'],['la rana','rana'],['el conejo','conejo']],2,'pascua'],
  ['Con cubo y pala me haces en la arena. ¿Qué soy?',[['el castillo de arena','castillo_arena'],['la casa','casa'],['la tarta','tarta']],0,'verano'],
  ['Me abres en la playa para hacer sombra. ¿Qué soy?',[['el paraguas','paraguas'],['la sombrilla','sombrilla'],['la toalla','toalla']],1,'verano'],
  ['Vivo en el bosque y tengo el cuerpo lleno de pinchos. ¿Quién soy?',[['la ardilla','ardilla'],['el conejo','conejo'],['el erizo','erizo']],2,'otono'],
  ['Salgo en el bosque cuando llueve y parezco un sombrero. ¿Qué soy?',[['la seta','seta'],['la hoja','hoja'],['la flor','flor']],0,'otono'],
  ["Tengo rayas blancas y negras y parezco un caballo. ¿Quién soy?", [["la cebra", "cebra"], ["el tigre", "tigre"], ["el caballo", "caballo"]], 0],
  ["Tengo un caparazón duro, camino muy despacio y escondo la cabeza. ¿Quién soy?", [["el caracol", "caracol"], ["la tortuga", "tortuga"], ["el erizo", "erizo"]], 1],
  ["Soy verde, salto en el charco y hago croac, croac. ¿Quién soy?", [["el pez", "pez"], ["el loro", "loro"], ["la rana", "rana"]], 2],
  ["Tengo plumas de colores y repito lo que dices. ¿Quién soy?", [["el loro", "loro"], ["la paloma", "paloma"], ["la gaviota", "gaviota"]], 0],
  ["Soy amarillo y curvo, y me pelas antes de comerme. ¿Qué soy?", [["la pera", "pera"], ["el plátano", "platano"], ["la manzana", "manzana"]], 1],
  ["Soy amarillo y muy ácido; si me chupas, pones caras raras. ¿Qué soy?", [["la naranja", "naranja"], ["la fresa", "fresa"], ["el limón", "limon"]], 2],
  ["Tengo cuatro patas pero no ando; en mí comes y haces los deberes. ¿Qué soy?", [["la mesa", "mesa"], ["la silla", "silla"], ["la cama", "cama"]], 0],
  ["Me pones en los pies antes que los zapatos. ¿Qué soy?", [["los guantes", "guantes"], ["los calcetines", "calcetines"], ["la bufanda", "bufanda"]], 1],
  ["Tengo alas pero no soy un pájaro, y llevo a la gente por el cielo. ¿Qué soy?", [["el barco", "barco"], ["el tren", "tren"], ["el avión", "avion"]], 2],
  ["Soy blanca, me da la vaca y me bebes en el desayuno. ¿Qué soy?", [["la leche", "leche"], ["el zumo", "zumo"], ["el agua", "agua"]], 0],
  ["Vivo en el mar, soy enorme y echo agua por la cabeza. ¿Quién soy?", [["el tiburón", "tiburon"], ["la ballena", "ballena"], ["el delfín", "delfin"]], 1],
  ["Tengo pinzas y camino de lado por la playa. ¿Quién soy?", [["el pulpo", "pulpo"], ["la medusa", "medusa"], ["el cangrejo", "cangrejo"]], 2],
  ["Tengo dos agujeros para los dedos y corto el papel. ¿Qué soy?", [["las tijeras", "tijeras"], ["la regla", "regla"], ["el pegamento", "pegamento"]], 0],
  ["Me llevas a la espalda con los libros del cole. ¿Qué soy?", [["la caja", "caja"], ["la mochila", "mochila"], ["el abrigo", "abrigo"]], 1],
  ["Me cuelgo de las ramas con la cola y me encantan los plátanos. ¿Quién soy?", [["el oso", "oso"], ["la ardilla", "ardilla"], ["el mono", "mono"]], 2],
  ["Tengo una bolsa en la tripa y salto con mi cría dentro. ¿Quién soy?", [["el canguro", "canguro"], ["el conejo", "conejo"], ["la rana", "rana"]], 0],
  ["Soy de cristal, estoy en la pared y por mí ves la calle. ¿Qué soy?", [["la puerta", "puerta"], ["la ventana", "ventana"], ["la lámpara", "lampara"]], 1],
  ["Me tocas con dos palos y hago pom, pom. ¿Qué soy?", [["la flauta", "flauta"], ["la guitarra", "guitarra"], ["el tambor", "tambor"]], 2],
  ["Soy redondo, me das patadas y quiero entrar en la portería. ¿Qué soy?", [["el balón", "balon"], ["el casco", "casco"], ["la raqueta", "raqueta"]], 0],
  ["Soy rosa, tengo el hocico redondo y me encanta el barro. ¿Quién soy?", [["la oveja", "oveja"], ["el cerdo", "cerdo"], ["el burro", "burro"]], 1],
  ["Tengo una luz dentro y te acompaño por la noche en Samaín. ¿Qué soy?", [["el sol", "sol"], ["la mochila", "mochila"], ["el farol", "farol"]], 2, "samain"],
  ["Tengo un palo largo y barro el suelo; en Samaín parece que vuelo. ¿Qué soy?", [["la escoba", "escoba"], ["la cuerda", "cuerda"], ["la regla", "regla"]], 0, "samain"],
  ["Brillo en lo más alto del árbol de Navidad. ¿Qué soy?", [["el regalo", "regalo"], ["la estrella", "estrella_navidad"], ["el calcetín", "calcetines"]], 1, "navidad"],
  ["Vengo envuelto en papel con un lazo, y los Reyes me dejan junto a tus zapatos. ¿Qué soy?", [["la mochila", "mochila"], ["el zapato", "zapatos"], ["el regalo", "regalo"]], 2, "navidad"],
  ["Soy de fuego, me encienden en el Magosto y junto a mí asan las castañas. ¿Qué soy?", [["la hoguera", "hoguera"], ["la vela", "vela"], ["el sol", "sol"]], 0, "magosto"],
  ["Soy un montón de papelitos de colores y en Entroido te caigo encima. ¿Qué soy?", [["la nieve", "nieve"], ["el confeti", "confeti"], ["las hojas", "hojas"]], 1, "entroido"],
  ["Soy de colores, huelo muy bien y las abejas me visitan. ¿Qué soy?", [["la hoja", "hoja"], ["la seta", "seta"], ["la flor", "flor"]], 2, "primavera"],
  ["Soy pequeño y amarillo, salgo de un huevo y digo pío, pío. ¿Quién soy?", [["el pollito", "pollito"], ["el pato", "pato"], ["el loro", "loro"]], 0, "pascua"],
  ["Me pones en los ojos para ver debajo del agua de la piscina. ¿Qué soy?", [["los prismáticos", "prismaticos"], ["las gafas de nadar", "gafas_nadar"], ["la gorra", "gorra"]], 1, "verano"],
  ["Me caigo del árbol en otoño, soy marrón o amarilla y crujo al pisarme. ¿Qué soy?", [["la flor", "flor"], ["la piedra", "piedra"], ["la hoja", "hoja"]], 2, "otono"],
  ["Late dentro de tu pecho y lo dibujas cuando quieres a alguien. ¿Qué soy?", [["el corazón", "corazon"], ["la mano", "mano"], ["el sol", "sol"]], 0, "dereitos"],
  ["Todos los niños tienen derecho a ir a un sitio a aprender, con maestra y pupitres. ¿Cuál es?", [["el parque", "parque"], ["el colegio", "colegio"], ["la playa", "playa"]], 1, "dereitos"],
  ["Me das cuando quieres a alguien: rodeas con los brazos y aprietas un poco. ¿Qué soy?", [["un balón", "balon"], ["una carta", "carta"], ["un abrazo", "abrazo"]], 2, "dereitos"],
  ["Tengo muchas hojas con las normas para vivir juntos. ¿Qué soy?", [["un libro", "libro"], ["un árbol", "arbol"], ["una lechuga", "lechuga"]], 0, "constitucion"],
  ["Para decidir algo en clase, todos levantan esta parte del cuerpo. ¿Cuál es?", [["el pie", "pie"], ["la mano", "mano"], ["la nariz", "nariz"]], 1, "constitucion"],
  ["Soy redondo, azul y verde, y en mí vivimos todos. ¿Qué soy?", [["la luna", "luna"], ["un balón", "balon"], ["el mundo", "mundo"]], 2, "constitucion"],
  ["Somos tres, venimos de Oriente en camello y dejamos regalos. ¿Quiénes somos?", [["los Reyes Magos", "rey"], ["los payasos", "payaso"], ["los médicos", "medico"]], 0, "reyes"],
  ["Tengo jorobas y llevo a los Reyes por el desierto. ¿Quién soy?", [["el caballo", "caballo"], ["el camello", "camello"], ["la vaca", "vaca"]], 1, "reyes"],
  ["Soy un dulce redondo con un agujero, frutas encima y una sorpresa dentro. ¿Qué soy?", [["la pizza", "pizza"], ["el pan", "pan"], ["el roscón", "roscon"]], 2, "reyes"],
  ["Me ponen velas encima y las soplas pidiendo un deseo. ¿Qué soy?", [["la tarta", "tarta"], ["la pizza", "pizza"], ["el plato", "plato"]], 0, "cumple"],
  ["Me inflan de aire, soy de colores y vuelo atado a un hilo. ¿Qué soy?", [["la pelota", "pelota"], ["el globo", "globo"], ["la cometa", "cometa"]], 1, "cumple"],
  ["Me cuelgan del techo, me dan con un palo y suelto caramelos. ¿Qué soy?", [["la lámpara", "lampara"], ["el regalo", "regalo"], ["la piñata", "pinata"]], 2, "cumple"],
  ["Soy un pájaro blanco y soy el dibujo de la paz. ¿Quién soy?", [["la paloma", "paloma"], ["el cuervo", "pajaro"], ["el loro", "loro"]], 0, "paz"],
  ["Te enfadas con un amigo y queréis hacer las paces. ¿Qué le das?", [["un balón", "balon"], ["un abrazo", "abrazo"], ["una piedra", "piedra"]], 1, "paz"],
  ["Salgo cuando hay sol y lluvia a la vez, y tengo siete colores. ¿Qué soy?", [["la nube", "nubes"], ["el rayo", "rayo"], ["el arcoíris", "arcoiris"]], 2, "paz"],
  ["Tengo alas pequeñitas y una varita, y salgo en muchos cuentos. ¿Quién soy?", [["el hada", "hada"], ["la bruja", "meiga"], ["la abeja", "abeja"]], 0, "libroinfantil"],
  ["Echo fuego por la boca, tengo alas y vivo en los cuentos. ¿Quién soy?", [["el lagarto", "lagartija"], ["el dragón", "dragon"], ["el murciélago", "murcielago"]], 1, "libroinfantil"],
  ["Tengo torres altas, un puente y vive un rey en mí. ¿Qué soy?", [["el faro", "faro"], ["la casa", "casa"], ["el castillo", "castillo"]], 2, "libroinfantil"],
  ["En el Día del Libro se regala un libro y una flor roja. ¿Qué flor es?", [["la rosa", "rosa"], ["la seta", "seta"], ["la hoja", "hoja"]], 0, "libro"],
  ["Es una casa llena de libros donde puedes llevarte uno prestado. ¿Qué es?", [["el museo", "museo"], ["la biblioteca", "biblioteca"], ["el mercado", "mercado"]], 1, "libro"],
  ["Llevo armadura y escudo, y en la leyenda me hago amigo de un dragón. ¿Quién soy?", [["el payaso", "payaso"], ["el médico", "medico"], ["el caballero", "caballero"]], 2, "libro"],
  ["Antes se escribía conmigo mojándome en tinta. ¿Qué soy?", [["la pluma", "pluma"], ["la escoba", "escoba"], ["la cuchara", "cuchara"]], 0, "letras"],
  ["Rimo, tengo versos y a veces se canta. ¿Qué soy?", [["un mapa", "mapa"], ["un poema", "poema"], ["un reloj", "reloj"]], 1, "letras"],
  ["Soy de madera, tengo cuatro patas y en un cuento gallego soy un juguete. ¿Quién soy?", [["la vaca", "vaca"], ["el perro", "perro"], ["el caballito", "caballo"]], 2, "letras"],
  ["Me llevas a la espalda con los libros y los lápices. ¿Qué soy?", [["la mochila", "mochila"], ["la cesta", "cesta"], ["la caja", "caja"]], 0, "fincurso"],
  ["Al acabar el curso te dan este papel que dice todo lo que has aprendido. ¿Qué es?", [["una carta", "carta"], ["un diploma", "diploma"], ["un mapa", "mapa"]], 1, "fincurso"],
  ["Cuando acaba el cole llego yo: sol, playa y piscina. ¿Quién soy?", [["el invierno", "nieve"], ["el otoño", "hojas"], ["el verano", "sol"]], 2, "fincurso"],
  ["En la noche de San Xoán me encienden en la playa. ¿Qué soy?", [["la hoguera", "hoguera"], ["la linterna", "linterna"], ["la lámpara", "lampara"]], 0, "sanxoan"],
  ["Soy un pez pequeño y plateado; en San Xoán me asan y me comen con pan. ¿Quién soy?", [["el tiburón", "tiburon"], ["la sardina", "sardina"], ["el pulpo", "pulpo"]], 1, "sanxoan"],
  ["Brillo en el cielo en la noche más corta del año. ¿Qué soy?", [["el sol", "sol"], ["la nube", "nubes"], ["la luna", "luna"]], 2, "sanxoan"],
  ["Soy una concha y la llevan los peregrinos que van a Santiago. ¿Qué soy?", [["la vieira", "vieira"], ["la estrella de mar", "estrella_mar"], ["el cangrejo", "cangrejo"]], 0, "galicia"],
  ["Tengo un saco que se llena de aire y sueno en las fiestas gallegas. ¿Qué soy?", [["el tambor", "tambor"], ["la gaita", "gaita"], ["la guitarra", "guitarra"]], 1, "galicia"],
  ["Soy una catedral muy grande y a mí llegan los caminantes del Camino. ¿Dónde estoy?", [["en Lugo", "muralla"], ["en el mar", "mar"], ["en Santiago", "catedral"]], 2, "galicia"]
].map(([q,ops,ok,temporada],i)=>({id:'a'+(i+1), q, ops, ok, temporada:temporada||''}));
/* 24/10/2026: las fiestas nuevas traen sus adivinanzas en contenido.json (temporadas[].adivinanzas) */
let _adivFiestas=null;
function adivFiestas(){ const ts=CONT.temporadas||[]; if(_adivFiestas===ts) return; _adivFiestas=ts;
  ts.forEach(t=>(t.adivinanzas||[]).forEach((a,k)=>{ const id='a_'+t.id+'_'+(k+1); if(!ADIVINANZAS.some(x=>x.id===id)) ADIVINANZAS.push({id, q:a[0], ops:a[1], ok:a[2], temporada:t.id}); })); }
const adivinanzasDe = t => { adivFiestas(); return ADIVINANZAS.filter(a=>a.temporada===t); };

const fotoOpcion = k => String(k).startsWith('e:') ? `<span class="emo" aria-hidden="true">${k.slice(2)}</span>` : imgHTML(k, true);
const hoyClave = () => claveDia(new Date());
function gustosDeHoy(p=perfil()){
  const log=cfgDe(p).gustosLog||[], hoy=hoyClave();
  const hechasHoy=log.filter(x=>claveDia(x.f)===hoy).map(x=>x.q);
  const orden=barajarCon(GUSTOS, semilla('gustos-'+p.id));
  const vueltas=id=>log.filter(x=>x.q===id).length; const minV=Math.min(...orden.map(g=>vueltas(g.id)));
  const pend=orden.filter(g=>!hechasHoy.includes(g.id) && vueltas(g.id)===minV);
  return {hechas:hechasHoy.length, pendientes: pend.slice(0, Math.max(0, 2-hechasHoy.length))};
}
function adivinanzaDeHoy(p=perfil()){
  const log=cfgDe(p).adivLog||[], hoy=hoyClave();
  const hecha=log.find(x=>claveDia(x.f)===hoy && !x.extra);
  adivFiestas(); const act=(typeof temporadasActivas==='function'?temporadasActivas():[]).map(t=>t.id);
  const vistas=new Set(log.map(x=>x.id));
  const cand=[...ADIVINANZAS.filter(a=>act.includes(a.temporada)), ...barajarCon(ADIVINANZAS.filter(a=>!a.temporada), semilla('adiv-'+p.id))];
  return {hecha:!!hecha, a: cand.find(a=>!vistas.has(a.id)) || cand[Math.floor(Date.now()/DIA_MS)%cand.length]};
}
function sorpresaHTML(){
  const g=gustosDeHoy(), a=adivinanzaDeHoy(); const quedan=g.pendientes.length + (a.hecha?0:1);
  if(!quedan) return `<button class="acceso blanco sorpresa hecha" type="button" data-ir="adivinanzas"><span class="emo-g">🎁</span><span><b>¡Sorpresas de hoy hechas!</b><span class="nota">Mañana hay más preguntas y otra adivinanza. ¿Otra adivinanza ahora?</span></span><span class="ir">${ic('dcha')}</span></button>`;
  return `<button class="acceso sorpresa" type="button" data-ir="gustos"><span class="emo-g">🎁</span><span><b>Sorpresas de hoy</b><span class="nota">${[g.pendientes.length?(g.pendientes.length===1?'1 pregunta sobre ti':g.pendientes.length+' preguntas sobre ti'):'', a.hecha?'':'1 adivinanza'].filter(Boolean).join(' y ')}.</span></span><span class="ir">${ic('dcha')}</span></button>`;
}

/* ---------- preguntas sobre sus gustos ---------- */
let flujoGustos=null;
definir('gustos', {nav:'inicio', pintar(){
  if(!flujoGustos || flujoGustos.dia!==hoyClave()) flujoGustos={dia:hoyClave(), cola:gustosDeHoy().pendientes.map(g=>g.id), i:0};
  const id=flujoGustos.cola[flujoGustos.i];
  if(!id){ flujoGustos=null; if(!adivinanzaDeHoy().hecha) ir('adivinanzas'); else ir('inicio'); return; }
  const g=GUSTOS.find(x=>x.id===id); const tot=flujoGustos.cola.length;
  $('#s-gustos').innerHTML = `<button class="volver" type="button" data-ir="inicio">${ic('atras')} Inicio</button>
  <div class="card gusto"><span class="pill">Pregunta ${flujoGustos.i+1} de ${tot} · sobre ti</span>
    <h1 class="tit gusto-q">${esc(g.q)} <button class="btn btn-mini" type="button" id="btnOirG" aria-label="Escuchar">${ic('altavoz')}</button></h1>
    <p class="nota">Aquí no hay respuestas buenas ni malas: toca lo que más te guste.</p>
    <div class="ops-dibujo ops-${g.ops.length}">${g.ops.map(([t,k],j)=>`<button type="button" class="op-d" data-j="${j}"><span class="ft">${fotoOpcion(k)}</span><b>${esc(t)}</b></button>`).join('')}</div></div>`;
  const leer=()=>decir(g.q+' '+g.ops.map(o=>o[0].replace(/[¡!]/g,'')).join(', ')+'.');
  $('#btnOirG').onclick=leer; leer();
  $$('#s-gustos .op-d').forEach(b=>b.onclick=()=>{ const o=g.ops[+b.dataset.j]; const cfg=aj;
    cfg.gustosLog=(cfg.gustosLog||[]); cfg.gustosLog.push({f:new Date().toISOString(), q:g.id, r:o[0]}); cfg.gustosLog=cfg.gustosLog.slice(-500); guardarAj();
    b.classList.add('elegida'); sonido('toc'); decir(['¡Qué bien!','¡Me encanta!','¡Genial!','¡Apuntado!'][flujoGustos.i%4]);
    setTimeout(()=>{ flujoGustos.i++; ir('gustos'); }, 900); });
}});

/* ---------- adivinanzas ---------- */
let flujoAdiv=null;
definir('adivinanzas', {nav:'inicio', pintar(op){
  if(op && op.temporada) flujoAdiv={lista:adivinanzasDe(op.temporada), i:0, extra:true, temporada:op.temporada};
  else if(!flujoAdiv){ const d=adivinanzaDeHoy(); flujoAdiv={lista:[d.a], i:0, extra:d.hecha}; }
  const a=flujoAdiv.lista[flujoAdiv.i];
  if(!a){ const t=flujoAdiv.temporada; flujoAdiv=null; ir(t?'temporada':'inicio', t); return; }
  let intentos=0;
  $('#s-adivinanzas').innerHTML = `<button class="volver" type="button" id="volAdiv">${ic('atras')} ${flujoAdiv.temporada?'Volver':'Inicio'}</button>
  <div class="card gusto adiv"><span class="pill">🤔 Adivinanza${flujoAdiv.lista.length>1?` ${flujoAdiv.i+1} de ${flujoAdiv.lista.length}`:''}</span>
    <h1 class="tit gusto-q">${esc(a.q)} <button class="btn btn-mini" type="button" id="btnOirA" aria-label="Escuchar">${ic('altavoz')}</button></h1>
    <div class="ops-dibujo ops-3">${a.ops.map(([t,k],j)=>`<button type="button" class="op-d" data-j="${j}"><span class="ft">${fotoOpcion(k)}</span><b>${esc(t)}</b></button>`).join('')}</div>
    <p class="nota" id="adivMsg"></p></div>`;
  $('#volAdiv').onclick=()=>{ const t=flujoAdiv&&flujoAdiv.temporada; flujoAdiv=null; ir(t?'temporada':'inicio', t); };
  const leer=()=>decir(a.q); $('#btnOirA').onclick=leer; leer();
  $$('#s-adivinanzas .op-d').forEach(b=>b.onclick=()=>{ const j=+b.dataset.j; intentos++;
    if(j===a.ok){ b.classList.add('bien'); sonido('bien'); $('#adivMsg').textContent='¡Muy bien!';
      const cfg=aj; cfg.adivLog=(cfg.adivLog||[]); cfg.adivLog.push({f:new Date().toISOString(), id:a.id, intentos, ...(flujoAdiv.extra?{extra:true}:{})}); cfg.adivLog=cfg.adivLog.slice(-500); guardarAj();
      decir('¡Muy bien! Es '+a.ops[a.ok][0]+'.'); $$('#s-adivinanzas .op-d').forEach(x=>x.disabled=true);
      setTimeout(()=>{ if(!flujoAdiv) return; flujoAdiv.i++; if(flujoAdiv.i>=flujoAdiv.lista.length && !flujoAdiv.temporada){ flujoAdiv=null; confeti($('#s-adivinanzas .card')||document.body); setTimeout(()=>{ if(actual==='adivinanzas') ir('inicio'); }, 1400); } else ir('adivinanzas'); }, 1800);
    } else { b.classList.add('mal'); b.disabled=true; sonido('mal'); $('#adivMsg').textContent='¡Casi! Prueba otra vez.'; decir('¡Casi! Prueba otra vez.'); }
  });
}});

/* ---------- familia: sus respuestas ---------- */
function gustosAdultoHTML(p){
  const cfg=cfgDe(p), log=cfg.gustosLog||[], al=cfg.adivLog||[];
  const ult={}; log.forEach(x=>{ (ult[x.q]=ult[x.q]||[]).push(x); });
  const filas=GUSTOS.filter(g=>ult[g.id]).map(g=>{ const xs=ult[g.id]; const u=xs[xs.length-1]; const antes=xs.length>1 && xs[xs.length-2].r!==u.r ? ` <span class="nota">(antes: ${esc(xs[xs.length-2].r)})</span>` : '';
    return `<tr><td>${esc(g.q)}</td><td><b>${esc(u.r)}</b>${antes}</td><td>${esc(fechaCorta(u.f))}</td></tr>`; }).join('');
  const bien=al.filter(x=>x.intentos===1).length;
  return `<div class="card bloque"><h3 style="margin-bottom:6px">Lo que le gusta</h3><p class="nota" style="margin-bottom:10px">Cada día se le hacen 2 preguntas (se las lee el programa y elige con dibujos). ${log.length} respuestas hasta ahora.</p>
    ${filas?`<div class="tabla-w"><table><thead><tr><th>Pregunta</th><th>Respuesta</th><th>Fecha</th></tr></thead><tbody>${filas}</tbody></table></div>`:'<p class="vacio">Todavía no ha contestado ninguna.</p>'}</div>
    <div class="card bloque" style="margin-top:18px"><h3 style="margin-bottom:6px">Adivinanzas</h3><p class="nota">${al.length?`Ha hecho ${al.length} · ${bien} a la primera.`:'Todavía no ha hecho ninguna.'}</p></div>`;
}
