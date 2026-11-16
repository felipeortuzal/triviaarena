// Riviera Showdown — Cloudflare Workers + SQLite-backed Durable Objects.

// All guesses and scoring are authoritative inside the room object.

export const BANKS = [{"id":"area","title":"Maiores países e territórios","source":"Worldometer — Maiores Países do Mundo","snapshot":"Consulta: novembro de 2026","items":["Rússia","Canadá","China","Estados Unidos","Brasil","Austrália","Índia","Argentina","Cazaquistão","Argélia","RD Congo","Groenlândia","Arábia Saudita","México","Indonésia","Sudão","Líbia","Irã","Mongólia","Peru","Chade","Níger","Angola","Mali","África do Sul","Colômbia","Etiópia","Bolívia","Mauritânia","Egito","Tanzânia","Nigéria","Venezuela","Paquistão","Namíbia","Moçambique","Turquia","Chile","Zâmbia","Mianmar","Afeganistão","Somália","República Centro-Africana","Sudão do Sul","Ucrânia","Madagascar","Botsuana","Quênia","França","Iêmen","Tailândia","Espanha","Turcomenistão","Camarões","Papua-Nova Guiné","Suécia","Uzbequistão","Marrocos","Iraque","Paraguai","Zimbábue","Japão","Alemanha","Filipinas","Congo","Finlândia","Vietnã","Malásia","Noruega","Costa do Marfim","Polônia","Omã","Itália","Equador","Burkina Faso","Nova Zelândia","Gabão","Saara Ocidental","Guiné","Reino Unido","Uganda","Gana","Romênia","Laos","Guiana","Bielorrússia","Quirguistão","Senegal","Síria","Camboja","Uruguai","Suriname","Tunísia","Bangladesh","Nepal","Tajiquistão","Grécia","Nicarágua","Coreia do Norte","Malawi"]},{"id":"population","title":"Mais populosos do planeta","source":"Worldometer — Population by Country 2026","snapshot":"Estimativa 2026","items":["Índia","China","Estados Unidos","Indonésia","Paquistão","Nigéria","Brasil","Bangladesh","Rússia","Etiópia","México","Japão","Egito","Filipinas","RD Congo","Vietnã","Irã","Turquia","Alemanha","Tanzânia","Tailândia","Reino Unido","França","África do Sul","Itália","Quênia","Mianmar","Colômbia","Sudão","Uganda","Coreia do Sul","Argélia","Iraque","Espanha","Argentina","Afeganistão","Iêmen","Canadá","Angola","Ucrânia","Marrocos","Polônia","Uzbequistão","Moçambique","Malásia","Gana","Arábia Saudita","Peru","Madagascar","Costa do Marfim","Camarões","Nepal","Níger","Venezuela","Austrália","Coreia do Norte","Síria","Mali","Burkina Faso","Sri Lanka","Taiwan","Malawi","Zâmbia","Chade","Cazaquistão","Somália","Chile","Senegal","Guatemala","Romênia","Países Baixos","Equador","Camboja","Zimbábue","Guiné","Benim","Ruanda","Burundi","Bolívia","Sudão do Sul","Tunísia","Haiti","Bélgica","República Dominicana","Jordânia","Emirados Árabes Unidos","Honduras","Tajiquistão","Papua-Nova Guiné","Cuba","Suécia","Chéquia","Azerbaijão","Portugal","Togo","Grécia","Israel","Hungria","Áustria","Suíça"]},{"id":"gdp","title":"Maiores economias do mundo","source":"Worldometer / FMI — GDP by Country 2025","snapshot":"FMI WEO outubro de 2026","items":["Estados Unidos","China","Alemanha","Japão","Reino Unido","Índia","França","Rússia","Itália","Canadá","Brasil","Espanha","Coreia do Sul","Austrália","México","Turquia","Indonésia","Países Baixos","Arábia Saudita","Suíça","Polônia","Taiwan","Bélgica","Argentina","Irlanda","Suécia","Israel","Emirados Árabes Unidos","Singapura","Áustria","Tailândia","Noruega","Vietnã","Filipinas","Malásia","Dinamarca","Bangladesh","Colômbia","Romênia","África do Sul","Hong Kong","Paquistão","Chéquia","Irã","Egito","Chile","Portugal","Peru","Finlândia","Cazaquistão","Nigéria","Argélia","Grécia","Iraque","Nova Zelândia","Hungria","Catar","Ucrânia","Cuba","Marrocos","Kuwait","Eslováquia","Uzbequistão","Angola","Quênia","Bulgária","Equador","Porto Rico","República Dominicana","Etiópia","Guatemala","Gana","Omã","Sri Lanka","Croácia","Costa Rica","Venezuela","Luxemburgo","Sérvia","Costa do Marfim","Bielorrússia","Lituânia","RD Congo","Panamá","Tanzânia","Uruguai","Mianmar","Eslovênia","Turcomenistão","Azerbaijão","Uganda","Bolívia","Jordânia","Camarões","Zimbábue","Tunísia","Macau","Camboja","Paraguai","Bahrein"]},{"id":"movies","title":"Filmes mais bem avaliados","source":"IMDb Top 250 — cópia histórica de 01/11/2026","snapshot":"Retrato: 1º de novembro de 2026","items":["The Shawshank Redemption","The Godfather","The Dark Knight","The Godfather: Part II","The Lord of the Rings: The Return of the King","12 Angry Men","Schindler's List","The Lord of the Rings: The Fellowship of the Ring","Pulp Fiction","The Lord of the Rings: The Two Towers","The Good, the Bad and the Ugly","Forrest Gump","Inception","Fight Club","Star Wars: Episode V - The Empire Strikes Back","The Matrix","Interstellar","Goodfellas","One Flew Over the Cuckoo's Nest","Se7en","It's a Wonderful Life","The Silence of the Lambs","Saving Private Ryan","Seven Samurai","The Green Mile","Cidade de Deus","Life Is Beautiful","Terminator 2: Judgment Day","Back to the Future","Star Wars: Episode IV - A New Hope","Spirited Away","Gladiator","The Pianist","Kill Bill: The Whole Bloody Affair","Parasite","Grave of the Fireflies","Harakiri","The Lion King (1994)","Psycho","The Departed","Whiplash","The Prestige","American History X","Spider-Man: Across the Spider-Verse","Cinema Paradiso","Léon: The Professional","Casablanca","The Intouchables","The Usual Suspects","Django Unchained","Alien","Rear Window","Modern Times","Once Upon a Time in the West","WALL-E","City Lights","Apocalypse Now","Avengers: Infinity War","Memento","Dune: Part Two","Raiders of the Lost Ark","Spider-Man: Into the Spider-Verse","The Lives of Others","The Odyssey (2026)","Sunset Boulevard","Witness for the Prosecution","Paths of Glory","Inglourious Basterds","The Shining","The Great Dictator","Aliens","High and Low","12th Fail","Avengers: Endgame","Good Will Hunting","Coco","Toy Story (1995)","The Dark Knight Rises","Amadeus","Your Name","3 Idiots","Braveheart","Das Boot","Princess Mononoke","Oldboy","Dr. Strangelove","American Beauty","Attack on Titan: The Last Attack","Capernaum","Singin' in the Rain","Once Upon a Time in America","Joker (2019)","Toy Story 3","Star Wars: Episode VI - Return of the Jedi","Come and See","Requiem for a Dream","Incendies","Ikiru","The Hunt (2012)","Eternal Sunshine of the Spotless Mind"]}];
BANKS.push(...[{"id":"br-area","title":"Estados do Brasil por área territorial","source":"IBGE — Áreas Territoriais 2025","snapshot":"IBGE, 2025","sourceUrl":"https://www.ibge.gov.br/geociencias/organizacao-do-territorio/estrutura-territorial/15761-areas-territoriais.html","items":["Amazonas","Pará","Mato Grosso","Minas Gerais","Bahia","Mato Grosso do Sul","Goiás","Maranhão","Rio Grande do Sul","Tocantins","Piauí","São Paulo","Rondônia","Roraima","Paraná","Acre","Ceará","Amapá","Pernambuco","Santa Catarina","Paraíba","Rio Grande do Norte","Espírito Santo","Rio de Janeiro","Alagoas","Sergipe","Distrito Federal"]},{"id":"br-pop","title":"Estados brasileiros mais populosos","source":"IBGE — Estimativas da População das UFs","snapshot":"IBGE, 2025","sourceUrl":"https://agenciadenoticias.ibge.gov.br/media/com_mediaibge/arquivos/8383bdedce5a6d972e60dd32671e533a.pdf","items":["São Paulo","Minas Gerais","Rio de Janeiro","Bahia","Paraná","Rio Grande do Sul","Pernambuco","Ceará","Pará","Santa Catarina","Goiás","Maranhão","Amazonas","Paraíba","Espírito Santo","Mato Grosso","Rio Grande do Norte","Piauí","Alagoas","Distrito Federal","Mato Grosso do Sul","Sergipe","Rondônia","Tocantins","Acre","Amapá","Roraima"]},{"id":"pokemon","title":"Pokédex Nacional — primeiros 30","source":"The Pokémon Company — National Pokédex","snapshot":"Pokédex Nacional #1–30","sourceUrl":"https://www.pokemon.com/pokedex/","items":["Bulbasaur","Ivysaur","Venusaur","Charmander","Charmeleon","Charizard","Squirtle","Wartortle","Blastoise","Caterpie","Metapod","Butterfree","Weedle","Kakuna","Beedrill","Pidgey","Pidgeotto","Pidgeot","Rattata","Raticate","Spearow","Fearow","Ekans","Arbok","Pikachu","Raichu","Sandshrew","Sandslash","Nidoran♀","Nidorina"]},{"id":"elementos","title":"Tabela Periódica — ordem atômica","source":"IUPAC — Periodic Table","snapshot":"Números atômicos 1–30","sourceUrl":"https://iupac.org/what-we-do/periodic-table-of-elements/","items":["Hidrogênio","Hélio","Lítio","Berílio","Boro","Carbono","Nitrogênio","Oxigênio","Flúor","Neônio","Sódio","Magnésio","Alumínio","Silício","Fósforo","Enxofre","Cloro","Argônio","Potássio","Cálcio","Escândio","Titânio","Vanádio","Cromo","Manganês","Ferro","Cobalto","Níquel","Cobre","Zinco"]}]);


// 2.1 curated and dated category library (regional subdivisions retain global snapshot order).
BANKS.push(...[{"id":"epl-2025-26","title":"Premier League 2025-26 — classificação final","group":"Futebol","source":"Premier League / RSSSF","snapshot":"2025-26","sourceUrl":"https://www.premierleague.com/en/tables/premier-league/2025-26","items":["Arsenal","Manchester City","Manchester United","Aston Villa","Liverpool","AFC Bournemouth","Sunderland","Brighton & Hove Albion","Brentford","Chelsea","Fulham","Newcastle United","Everton","Leeds United","Crystal Palace","Nottingham Forest","Tottenham Hotspur","West Ham United","Burnley","Wolverhampton Wanderers"]},{"id":"epl-2024-25","title":"Premier League 2024-25 — classificação final","group":"Futebol","source":"Premier League / RSSSF","snapshot":"2024-25","sourceUrl":"https://www.rsssf.org/tablese/eng2025.html","items":["Liverpool","Arsenal","Manchester City","Chelsea","Newcastle United","Aston Villa","Nottingham Forest","Brighton & Hove Albion","AFC Bournemouth","Brentford","Fulham","Crystal Palace","Everton","West Ham United","Manchester United","Wolverhampton Wanderers","Tottenham Hotspur","Leicester City","Ipswich Town","Southampton"]},{"id":"epl-2023-24","title":"Premier League 2023-24 — classificação final","group":"Futebol","source":"Premier League / RSSSF","snapshot":"2023-24","sourceUrl":"https://www.rsssf.org/tablese/eng2024.html","items":["Manchester City","Arsenal","Liverpool","Aston Villa","Tottenham Hotspur","Chelsea","Newcastle United","Manchester United","West Ham United","Crystal Palace","Brighton & Hove Albion","AFC Bournemouth","Fulham","Wolverhampton Wanderers","Everton","Brentford","Nottingham Forest","Luton Town","Burnley","Sheffield United"]},{"id":"epl-2022-23","title":"Premier League 2022-23 — classificação final","group":"Futebol","source":"Premier League / RSSSF","snapshot":"2022-23","sourceUrl":"https://www.rsssf.org/tablese/eng2023.html","items":["Manchester City","Arsenal","Manchester United","Newcastle United","Liverpool","Brighton & Hove Albion","Aston Villa","Tottenham Hotspur","Brentford","Fulham","Crystal Palace","Chelsea","Wolverhampton Wanderers","West Ham United","AFC Bournemouth","Nottingham Forest","Everton","Leicester City","Leeds United","Southampton"]},{"id":"epl-2021-22","title":"Premier League 2021-22 — classificação final","group":"Futebol","source":"Premier League / RSSSF","snapshot":"2021-22","sourceUrl":"https://www.rsssf.org/tablese/eng2022.html","items":["Manchester City","Liverpool","Chelsea","Tottenham Hotspur","Arsenal","Manchester United","West Ham United","Leicester City","Brighton & Hove Albion","Wolverhampton Wanderers","Newcastle United","Crystal Palace","Brentford","Aston Villa","Southampton","Everton","Leeds United","Burnley","Watford","Norwich City"]},{"id":"epl-2020-21","title":"Premier League 2020-21 — classificação final","group":"Futebol","source":"Premier League / RSSSF","snapshot":"2020-21","sourceUrl":"https://www.rsssf.org/tablese/eng2021.html","items":["Manchester City","Manchester United","Liverpool","Chelsea","Leicester City","West Ham United","Tottenham Hotspur","Arsenal","Leeds United","Everton","Aston Villa","Newcastle United","Wolverhampton Wanderers","Crystal Palace","Southampton","Brighton & Hove Albion","Burnley","Fulham","West Bromwich Albion","Sheffield United"]},{"id":"f1-2025","title":"Fórmula 1 2025 — campeonato de pilotos","group":"Fórmula 1","source":"FIA / Formula1.com","snapshot":"2025","sourceUrl":"https://www.formula1.com/en/results/2025/drivers","items":["Lando Norris","Max Verstappen","Oscar Piastri","George Russell","Charles Leclerc","Lewis Hamilton","Kimi Antonelli","Alexander Albon","Carlos Sainz","Fernando Alonso","Nico Hülkenberg","Isack Hadjar","Oliver Bearman","Liam Lawson","Esteban Ocon","Lance Stroll","Yuki Tsunoda","Pierre Gasly","Gabriel Bortoleto","Franco Colapinto"]},{"id":"f1-2024","title":"Fórmula 1 2024 — campeonato de pilotos","group":"Fórmula 1","source":"FIA / Formula1.com","snapshot":"2024","sourceUrl":"https://www.formula1.com/en/results/2024/drivers","items":["Max Verstappen","Lando Norris","Charles Leclerc","Oscar Piastri","Carlos Sainz","George Russell","Lewis Hamilton","Sergio Pérez","Fernando Alonso","Pierre Gasly","Nico Hülkenberg","Yuki Tsunoda","Lance Stroll","Esteban Ocon","Kevin Magnussen","Alexander Albon","Daniel Ricciardo","Oliver Bearman","Franco Colapinto","Zhou Guanyu","Liam Lawson","Valtteri Bottas","Logan Sargeant","Jack Doohan"]},{"id":"f1-2023","title":"Fórmula 1 2023 — campeonato de pilotos","group":"Fórmula 1","source":"FIA / Formula1.com","snapshot":"2023","sourceUrl":"https://www.formula1.com/en/results/2023/drivers","items":["Max Verstappen","Sergio Pérez","Lewis Hamilton","Fernando Alonso","Charles Leclerc","Lando Norris","Carlos Sainz","George Russell","Oscar Piastri","Lance Stroll","Pierre Gasly","Esteban Ocon","Alexander Albon","Yuki Tsunoda","Valtteri Bottas","Nico Hülkenberg","Daniel Ricciardo","Zhou Guanyu","Kevin Magnussen","Liam Lawson","Logan Sargeant","Nyck de Vries"]},{"id":"f1-2022","title":"Fórmula 1 2022 — campeonato de pilotos","group":"Fórmula 1","source":"FIA / Formula1.com","snapshot":"2022","sourceUrl":"https://www.formula1.com/en/results/2022/drivers","items":["Max Verstappen","Charles Leclerc","Sergio Pérez","George Russell","Carlos Sainz","Lewis Hamilton","Lando Norris","Esteban Ocon","Fernando Alonso","Valtteri Bottas","Daniel Ricciardo","Sebastian Vettel","Kevin Magnussen","Pierre Gasly","Lance Stroll","Mick Schumacher","Yuki Tsunoda","Zhou Guanyu","Alexander Albon","Nicholas Latifi","Nyck de Vries","Nico Hülkenberg"]},{"id":"f1-2021","title":"Fórmula 1 2021 — campeonato de pilotos","group":"Fórmula 1","source":"FIA / Formula1.com","snapshot":"2021","sourceUrl":"https://www.formula1.com/en/results/2021/drivers","items":["Max Verstappen","Lewis Hamilton","Valtteri Bottas","Sergio Pérez","Carlos Sainz","Lando Norris","Charles Leclerc","Daniel Ricciardo","Pierre Gasly","Fernando Alonso","Esteban Ocon","Sebastian Vettel","Lance Stroll","Yuki Tsunoda","George Russell","Kimi Räikkönen","Nicholas Latifi","Antonio Giovinazzi","Mick Schumacher","Robert Kubica","Nikita Mazepin"]},{"id":"pokemon-kanto-31","title":"Pokédex Kanto — posições 31–60","group":"Games","source":"The Pokémon Company — National Pokédex","snapshot":"Pokédex Nacional, Gen. I","sourceUrl":"https://www.pokemon.com/pokedex/","items":["Nidoqueen","Nidoran♂","Nidorino","Nidoking","Clefairy","Clefable","Vulpix","Ninetales","Jigglypuff","Wigglytuff","Zubat","Golbat","Oddish","Gloom","Vileplume","Paras","Parasect","Venonat","Venomoth","Diglett","Dugtrio","Meowth","Persian","Psyduck","Golduck","Mankey","Primeape","Growlithe","Arcanine","Poliwag"]},{"id":"pokemon-kanto-61","title":"Pokédex Kanto — posições 61–90","group":"Games","source":"The Pokémon Company — National Pokédex","snapshot":"Pokédex Nacional, Gen. I","sourceUrl":"https://www.pokemon.com/pokedex/","items":["Poliwhirl","Poliwrath","Abra","Kadabra","Alakazam","Machop","Machoke","Machamp","Bellsprout","Weepinbell","Victreebel","Tentacool","Tentacruel","Geodude","Graveler","Golem","Ponyta","Rapidash","Slowpoke","Slowbro","Magnemite","Magneton","Farfetch'd","Doduo","Dodrio","Seel","Dewgong","Grimer","Muk","Shellder"]},{"id":"pokemon-kanto-91","title":"Pokédex Kanto — posições 91–120","group":"Games","source":"The Pokémon Company — National Pokédex","snapshot":"Pokédex Nacional, Gen. I","sourceUrl":"https://www.pokemon.com/pokedex/","items":["Cloyster","Gastly","Haunter","Gengar","Onix","Drowzee","Hypno","Krabby","Kingler","Voltorb","Electrode","Exeggcute","Exeggutor","Cubone","Marowak","Hitmonlee","Hitmonchan","Lickitung","Koffing","Weezing","Rhyhorn","Rhydon","Chansey","Tangela","Kangaskhan","Horsea","Seadra","Goldeen","Seaking","Staryu"]},{"id":"pokemon-kanto-121","title":"Pokédex Kanto — posições 121–151","group":"Games","source":"The Pokémon Company — National Pokédex","snapshot":"Pokédex Nacional, Gen. I","sourceUrl":"https://www.pokemon.com/pokedex/","items":["Starmie","Mr. Mime","Scyther","Jynx","Electabuzz","Magmar","Pinsir","Tauros","Magikarp","Gyarados","Lapras","Ditto","Eevee","Vaporeon","Jolteon","Flareon","Porygon","Omanyte","Omastar","Kabuto","Kabutops","Aerodactyl","Snorlax","Articuno","Zapdos","Moltres","Dratini","Dragonair","Dragonite","Mewtwo","Mew"]},{"id":"area-americas","title":"Maiores países por área — Américas","group":"Geografia","source":"Worldometer — Maiores Países do Mundo (recorte regional)","snapshot":"Consulta: novembro de 2026 · países do top 100 mundial","sourceUrl":"https://www.worldometers.info/geography/largest-countries-in-the-world/","items":["Canadá","Estados Unidos","Brasil","Argentina","Groenlândia","México","Peru","Colômbia","Bolívia","Venezuela","Chile","Paraguai","Equador","Guiana","Uruguai","Suriname","Nicarágua"]},{"id":"population-americas","title":"Mais populosos — Américas","group":"Geografia","source":"Worldometer — Population by Country 2026 (recorte regional)","snapshot":"Estimativa 2026 · países do top 100 mundial","sourceUrl":"https://www.worldometers.info/world-population/population-by-country/","items":["Estados Unidos","Brasil","México","Colômbia","Argentina","Canadá","Peru","Venezuela","Chile","Guatemala","Equador","Bolívia","Haiti","República Dominicana","Honduras","Cuba"]},{"id":"gdp-americas","title":"Maiores economias — Américas","group":"Geografia","source":"Worldometer / FMI — GDP by Country 2025 (recorte regional)","snapshot":"FMI WEO outubro de 2026 · países do top 100 mundial","sourceUrl":"https://www.worldometers.info/gdp/gdp-by-country/","items":["Estados Unidos","Canadá","Brasil","México","Argentina","Colômbia","Chile","Peru","Cuba","Equador","Porto Rico","República Dominicana","Guatemala","Costa Rica","Venezuela","Panamá","Uruguai","Bolívia","Paraguai"]},{"id":"area-europa","title":"Maiores países por área — Europa","group":"Geografia","source":"Worldometer — Maiores Países do Mundo (recorte regional)","snapshot":"Consulta: novembro de 2026 · países do top 100 mundial","sourceUrl":"https://www.worldometers.info/geography/largest-countries-in-the-world/","items":["Ucrânia","França","Espanha","Suécia","Alemanha","Finlândia","Noruega","Polônia","Itália","Reino Unido","Romênia","Bielorrússia","Grécia"]},{"id":"population-europa","title":"Mais populosos — Europa","group":"Geografia","source":"Worldometer — Population by Country 2026 (recorte regional)","snapshot":"Estimativa 2026 · países do top 100 mundial","sourceUrl":"https://www.worldometers.info/world-population/population-by-country/","items":["Alemanha","Reino Unido","França","Itália","Espanha","Ucrânia","Polônia","Romênia","Países Baixos","Bélgica","Suécia","Chéquia","Portugal","Grécia","Hungria","Áustria","Suíça"]},{"id":"gdp-europa","title":"Maiores economias — Europa","group":"Geografia","source":"Worldometer / FMI — GDP by Country 2025 (recorte regional)","snapshot":"FMI WEO outubro de 2026 · países do top 100 mundial","sourceUrl":"https://www.worldometers.info/gdp/gdp-by-country/","items":["Alemanha","Reino Unido","França","Itália","Espanha","Países Baixos","Suíça","Polônia","Bélgica","Irlanda","Suécia","Áustria","Noruega","Dinamarca","Romênia","Chéquia","Portugal","Finlândia","Grécia","Hungria","Ucrânia","Eslováquia","Bulgária","Croácia","Luxemburgo","Sérvia","Bielorrússia","Lituânia","Eslovênia"]},{"id":"area-africa","title":"Maiores países por área — África","group":"Geografia","source":"Worldometer — Maiores Países do Mundo (recorte regional)","snapshot":"Consulta: novembro de 2026 · países do top 100 mundial","sourceUrl":"https://www.worldometers.info/geography/largest-countries-in-the-world/","items":["Argélia","RD Congo","Sudão","Líbia","Chade","Níger","Angola","Mali","África do Sul","Etiópia","Mauritânia","Egito","Tanzânia","Nigéria","Namíbia","Moçambique","Zâmbia","Somália","República Centro-Africana","Sudão do Sul","Madagascar","Botsuana","Quênia","Camarões","Marrocos","Zimbábue","Congo","Costa do Marfim","Burkina Faso","Gabão","Saara Ocidental","Guiné","Uganda","Gana","Senegal","Tunísia","Malawi"]},{"id":"population-africa","title":"Mais populosos — África","group":"Geografia","source":"Worldometer — Population by Country 2026 (recorte regional)","snapshot":"Estimativa 2026 · países do top 100 mundial","sourceUrl":"https://www.worldometers.info/world-population/population-by-country/","items":["Nigéria","Etiópia","Egito","RD Congo","Tanzânia","África do Sul","Quênia","Sudão","Uganda","Argélia","Angola","Marrocos","Moçambique","Gana","Madagascar","Costa do Marfim","Camarões","Níger","Mali","Burkina Faso","Malawi","Zâmbia","Chade","Somália","Senegal","Zimbábue","Guiné","Benim","Ruanda","Burundi","Sudão do Sul","Tunísia","Togo"]},{"id":"gdp-africa","title":"Maiores economias — África","group":"Geografia","source":"Worldometer / FMI — GDP by Country 2025 (recorte regional)","snapshot":"FMI WEO outubro de 2026 · países do top 100 mundial","sourceUrl":"https://www.worldometers.info/gdp/gdp-by-country/","items":["África do Sul","Egito","Nigéria","Argélia","Marrocos","Angola","Quênia","Etiópia","Gana","Costa do Marfim","RD Congo","Tanzânia","Uganda","Camarões","Zimbábue","Tunísia"]},{"id":"area-asia","title":"Maiores países por área — Ásia","group":"Geografia","source":"Worldometer — Maiores Países do Mundo (recorte regional)","snapshot":"Consulta: novembro de 2026 · países do top 100 mundial","sourceUrl":"https://www.worldometers.info/geography/largest-countries-in-the-world/","items":["China","Índia","Cazaquistão","Arábia Saudita","Indonésia","Irã","Mongólia","Paquistão","Mianmar","Afeganistão","Iêmen","Tailândia","Turcomenistão","Uzbequistão","Iraque","Japão","Filipinas","Vietnã","Malásia","Omã","Laos","Quirguistão","Síria","Camboja","Bangladesh","Nepal","Tajiquistão","Coreia do Norte"]},{"id":"population-asia","title":"Mais populosos — Ásia","group":"Geografia","source":"Worldometer — Population by Country 2026 (recorte regional)","snapshot":"Estimativa 2026 · países do top 100 mundial","sourceUrl":"https://www.worldometers.info/world-population/population-by-country/","items":["Índia","China","Indonésia","Paquistão","Bangladesh","Japão","Filipinas","Vietnã","Irã","Tailândia","Mianmar","Coreia do Sul","Iraque","Afeganistão","Iêmen","Uzbequistão","Malásia","Arábia Saudita","Nepal","Coreia do Norte","Síria","Sri Lanka","Taiwan","Cazaquistão","Camboja","Jordânia","Emirados Árabes Unidos","Tajiquistão","Azerbaijão","Israel"]},{"id":"gdp-asia","title":"Maiores economias — Ásia","group":"Geografia","source":"Worldometer / FMI — GDP by Country 2025 (recorte regional)","snapshot":"FMI WEO outubro de 2026 · países do top 100 mundial","sourceUrl":"https://www.worldometers.info/gdp/gdp-by-country/","items":["China","Japão","Índia","Coreia do Sul","Indonésia","Arábia Saudita","Taiwan","Israel","Emirados Árabes Unidos","Singapura","Tailândia","Vietnã","Filipinas","Malásia","Bangladesh","Hong Kong","Paquistão","Irã","Cazaquistão","Iraque","Catar","Kuwait","Uzbequistão","Omã","Sri Lanka","Mianmar","Turcomenistão","Azerbaijão","Jordânia","Macau","Camboja","Bahrein"]},{"id":"movies-1950s","title":"IMDb: melhores filmes dos anos 1950","group":"Cinema","source":"IMDb Top 250 — recorte por década","snapshot":"Retrato: 1º de novembro de 2026","sourceUrl":"https://www.imdb.com/chart/top/","items":["12 Angry Men","Seven Samurai","Rear Window","Sunset Boulevard","Witness for the Prosecution","Paths of Glory","Singin' in the Rain","Ikiru"]},{"id":"movies-1970s","title":"IMDb: melhores filmes dos anos 1970","group":"Cinema","source":"IMDb Top 250 — recorte por década","snapshot":"Retrato: 1º de novembro de 2026","sourceUrl":"https://www.imdb.com/chart/top/","items":["The Godfather","The Godfather: Part II","One Flew Over the Cuckoo's Nest","Star Wars: Episode IV - A New Hope","Alien","Apocalypse Now"]},{"id":"movies-1980s","title":"IMDb: melhores filmes dos anos 1980","group":"Cinema","source":"IMDb Top 250 — recorte por década","snapshot":"Retrato: 1º de novembro de 2026","sourceUrl":"https://www.imdb.com/chart/top/","items":["Star Wars: Episode V - The Empire Strikes Back","Back to the Future","Grave of the Fireflies","Cinema Paradiso","Raiders of the Lost Ark","The Shining","Aliens","Amadeus","Das Boot","Once Upon a Time in America","Star Wars: Episode VI - Return of the Jedi","Come and See"]},{"id":"movies-1990s","title":"IMDb: melhores filmes dos anos 1990","group":"Cinema","source":"IMDb Top 250 — recorte por década","snapshot":"Retrato: 1º de novembro de 2026","sourceUrl":"https://www.imdb.com/chart/top/","items":["The Shawshank Redemption","Schindler's List","Pulp Fiction","Forrest Gump","Fight Club","The Matrix","Goodfellas","Se7en","The Silence of the Lambs","Saving Private Ryan","The Green Mile","Life Is Beautiful","Terminator 2: Judgment Day","The Lion King (1994)","American History X","Léon: The Professional","The Usual Suspects","Good Will Hunting","Toy Story (1995)","Braveheart","Princess Mononoke","American Beauty"]},{"id":"movies-2000s","title":"IMDb: melhores filmes dos anos 2000","group":"Cinema","source":"IMDb Top 250 — recorte por década","snapshot":"Retrato: 1º de novembro de 2026","sourceUrl":"https://www.imdb.com/chart/top/","items":["The Dark Knight","The Lord of the Rings: The Return of the King","The Lord of the Rings: The Fellowship of the Ring","The Lord of the Rings: The Two Towers","Cidade de Deus","Spirited Away","Gladiator","The Pianist","Kill Bill: The Whole Bloody Affair","The Departed","The Prestige","WALL-E","Memento","The Lives of Others","Inglourious Basterds","3 Idiots","Oldboy","Requiem for a Dream","Eternal Sunshine of the Spotless Mind"]},{"id":"movies-2010s","title":"IMDb: melhores filmes dos anos 2010","group":"Cinema","source":"IMDb Top 250 — recorte por década","snapshot":"Retrato: 1º de novembro de 2026","sourceUrl":"https://www.imdb.com/chart/top/","items":["Inception","Interstellar","Parasite","Whiplash","Django Unchained","Avengers: Infinity War","Spider-Man: Into the Spider-Verse","The Intouchables","Avengers: Endgame","Coco","The Dark Knight Rises","Your Name","Capernaum","Joker (2019)","Toy Story 3","Incendies","The Hunt (2012)"]}]);


// Group categories for the setup UI. Derived rankings carry their snapshot and provenance.
for(const b of BANKS){
 if(!b.group){
   b.group=({area:"Geografia",population:"Geografia",gdp:"Economia",movies:"Cinema","br-area":"Brasil","br-pop":"Brasil",pokemon:"Games",elementos:"Ciência"})[b.id]||"Cultura geral";
 }
}

export function normalizeAnswer(s){return String(s||"").replace(/♀/g," female ").replace(/♂/g," male ").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ")}

function safeJson(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}})}

function randomToken(){return Array.from(crypto.getRandomValues(new Uint8Array(24)),x=>x.toString(16).padStart(2,"0")).join("")}

function randomCode(){const a="ABCDEFGHJKLMNPQRSTUVWXYZ23456789",r=crypto.getRandomValues(new Uint8Array(6));return Array.from(r,x=>a[x%a.length]).join("")}

const SYNONYMS={
 "estados unidos":["eua","usa","united states"],"reino unido":["uk","inglaterra","united kingdom"],"rd congo":["rdc","republica democratica do congo"],"paises baixos":["holanda","netherlands"],
 "sao paulo":["sp"],"rio de janeiro":["rj"],"minas gerais":["mg"],"rio grande do sul":["rs"],"mato grosso":["mt"],"mato grosso do sul":["ms"],"distrito federal":["df","brasilia"],"espirito santo":["es"],"parana":["pr"],"bahia":["ba"],"ceara":["ce"],"pernambuco":["pe"],"santa catarina":["sc"],"rio grande do norte":["rn"],"paraiba":["pb"],"maranhao":["ma"],"goias":["go"],"amazonas":["am"],"para":["pa"],"acre":["ac"],"amapa":["ap"],"roraima":["rr"],"rondonia":["ro"],"sergipe":["se"],"alagoas":["al"],"piaui":["pi"],"tocantins":["to"],
 "the godfather":["o poderoso chefao"],"the godfather part ii":["o poderoso chefao 2"],"the shawshank redemption":["um sonho de liberdade"],"the dark knight":["batman o cavaleiro das trevas"],"the matrix":["matrix"],"inception":["a origem"],"interstellar":["interestelar"],"fight club":["clube da luta"],"forrest gump":["forrest gump o contador de historias"],
 "bulbasaur":["bulbassauro"],"ivysaur":["ivissauro"],"venusaur":["venussauro"],"nidoran female":["nidoran femea","nidoran f"]
};
export function levenshtein(a,b){if(Math.abs(a.length-b.length)>3)return 99;let last=Array.from({length:b.length+1},(_,j)=>j);for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,last[j]+1,last[j-1]+(a[i-1]===b[j-1]?0:1));last=next;}return last[b.length];}
export function matchAnswer(raw,options){const value=normalizeAnswer(raw);if(!value)return -1;const exact=options.findIndex(item=>normalizeAnswer(item)===value);if(exact>=0)return exact;const alias=options.findIndex(item=>(SYNONYMS[normalizeAnswer(item)]||[]).map(normalizeAnswer).includes(value));if(alias>=0)return alias;if(value.length<6)return -1;let best=99,at=-1,ties=0;options.forEach((item,i)=>{const d=levenshtein(value,normalizeAnswer(item));if(d<best){best=d;at=i;ties=1}else if(d===best)ties++});return best<=2&&ties===1?at:-1;}
function suggestAnswer(raw,options){const q=normalizeAnswer(raw);return options.map(v=>({v,d:levenshtein(q,normalizeAnswer(v))})).sort((a,b)=>a.d-b.d).slice(0,3).map(x=>x.v)}


export const ROUND_DURATIONS=[20,30,45];
export function normalizeRoomConfig(input={}){
 const duration=ROUND_DURATIONS.includes(Number(input.durationSeconds))?Number(input.durationSeconds):30;
 const categoryIds=Array.isArray(input.categoryIds)?
 [...new Set(input.categoryIds.filter(id=>typeof id==="string"&&BANKS.some(b=>b.id===id)))]:BANKS.map(b=>b.id);
 if(categoryIds.length===0)throw new Error("Escolha pelo menos uma categoria válida.");
 return {durationSeconds:duration,categoryIds,turbo:input.turbo===true,autoNext:input.autoNext===true};
}
export function emptyStats(){return {played:0,valid:0,exact:0,distanceSum:0,first:0,second:0,turboWins:0,fastestExactMs:null,matches:0,wins:0};}
function ensureStats(p){if(!p.stats)p.stats=emptyStats();if(!p.matchStats)p.matchStats=emptyStats();}
export function getPlayerStats(p){const s=p?.stats||emptyStats(),m=p?.matchStats||emptyStats();return {career:{...s,averageDistance:s.valid?Math.round(s.distanceSum/s.valid*10)/10:null},match:{...m,averageDistance:m.valid?Math.round(m.distanceSum/m.valid*10)/10:null}};}
export function calculateAwards(room){
 const players=Object.values(room.players||{}).filter(p=>(p.matchStats?.played||0)>0);
 const items=[];
 const award=(title,emoji,filter)=>{const eligible=players.filter(filter);if(!eligible.length)return;items.push({title,emoji,nicks:eligible.map(p=>p.nick)});};
 let maxExact=Math.max(0,...players.map(p=>p.matchStats?.exact||0));
 if(maxExact>0)award("Sniper","🎯",p=>p.matchStats.exact===maxExact);
 let valid=players.filter(p=>(p.matchStats?.valid||0)>0);
 if(valid.length){const best=Math.min(...valid.map(p=>p.matchStats.distanceSum/p.matchStats.valid));award("Professor","🧠",p=>p.matchStats.valid>0&&Math.abs(p.matchStats.distanceSum/p.matchStats.valid-best)<1e-9);}
 const fastest=players.filter(p=>p.matchStats?.fastestExactMs!==null&&p.matchStats?.fastestExactMs!==undefined);
 if(fastest.length){const best=Math.min(...fastest.map(p=>p.matchStats.fastestExactMs));award("Flash","⚡",p=>p.matchStats.fastestExactMs===best);}
 const maxTurbo=Math.max(0,...players.map(p=>p.matchStats?.turboWins||0));
 if(maxTurbo>0)award("Rei do Turbo","🚀",p=>p.matchStats.turboWins===maxTurbo);
 return items;
}


export const PHRASES=[{"id":"proverb-01","lead":"Água mole em pedra dura,","answer":"tanto bate até que fura","alternatives":["tanto bate que fura","até que fura"]},{"id":"proverb-02","lead":"De grão em grão,","answer":"a galinha enche o papo","alternatives":["a galinha vai enchendo o papo"]},{"id":"proverb-03","lead":"Casa de ferreiro,","answer":"espeto de pau","alternatives":[]},{"id":"proverb-04","lead":"Filho de peixe,","answer":"peixinho é","alternatives":["peixe é","peixinho sera"]},{"id":"proverb-05","lead":"A pressa é inimiga","answer":"da perfeição","alternatives":["da perfeicao"]},{"id":"proverb-06","lead":"Quem com ferro fere,","answer":"com ferro será ferido","alternatives":["com ferro e ferido"]},{"id":"proverb-07","lead":"Quem espera,","answer":"sempre alcança","alternatives":["sempre alcanca"]},{"id":"proverb-08","lead":"Em terra de cego,","answer":"quem tem um olho é rei","alternatives":["quem tem um olho so e rei"]},{"id":"proverb-09","lead":"Cavalo dado,","answer":"não se olha os dentes","alternatives":["nao se olha os dentes","não se olha os dentes de um cavalo dado"]},{"id":"proverb-10","lead":"Antes só,","answer":"do que mal acompanhado","alternatives":[]},{"id":"proverb-11","lead":"O barato,","answer":"sai caro","alternatives":[]},{"id":"proverb-12","lead":"Quem avisa,","answer":"amigo é","alternatives":["e amigo"]},{"id":"proverb-13","lead":"Uma andorinha só,","answer":"não faz verão","alternatives":["nao faz o verao"]},{"id":"proverb-14","lead":"Depois da tempestade,","answer":"vem a bonança","alternatives":["vem a bonanca","vem o sol"]},{"id":"proverb-15","lead":"Não adianta chorar,","answer":"pelo leite derramado","alternatives":["sobre o leite derramado"]},{"id":"proverb-16","lead":"A união,","answer":"faz a força","alternatives":["faz a forca"]},{"id":"proverb-17","lead":"Nem tudo que reluz,","answer":"é ouro","alternatives":["e ouro"]},{"id":"proverb-18","lead":"Quem semeia vento,","answer":"colhe tempestade","alternatives":["colhe a tempestade"]},{"id":"proverb-19","lead":"Roupa suja,","answer":"se lava em casa","alternatives":["lava se em casa"]},{"id":"proverb-20","lead":"A mentira,","answer":"tem perna curta","alternatives":["tem pernas curtas"]},{"id":"proverb-21","lead":"A esperança,","answer":"é a última que morre","alternatives":["e a ultima a morrer"]},{"id":"proverb-22","lead":"Águas passadas,","answer":"não movem moinhos","alternatives":["nao movem moinho"]},{"id":"proverb-23","lead":"Gato escaldado,","answer":"tem medo de água fria","alternatives":["tem medo da agua fria"]},{"id":"proverb-24","lead":"Não julgue um livro,","answer":"pela capa","alternatives":["por sua capa"]},{"id":"proverb-25","lead":"Quem muito fala,","answer":"pouco faz","alternatives":[]},{"id":"proverb-26","lead":"O hábito,","answer":"não faz o monge","alternatives":["nao faz monge"]},{"id":"proverb-27","lead":"Cada macaco,","answer":"no seu galho","alternatives":["fica no seu galho"]},{"id":"proverb-28","lead":"Quando um não quer,","answer":"dois não brigam","alternatives":["dois nao brigam"]},{"id":"proverb-29","lead":"Quem procura,","answer":"acha","alternatives":["encontra"]},{"id":"proverb-30","lead":"Mais vale tarde,","answer":"do que nunca","alternatives":[]},{"id":"proverb-31","lead":"Quem ri por último,","answer":"ri melhor","alternatives":["ri mais alto","ri mais"]},{"id":"proverb-32","lead":"O peixe,","answer":"morre pela boca","alternatives":["pela boca morre"]},{"id":"proverb-33","lead":"Em boca fechada,","answer":"não entra mosca","alternatives":["nao entram moscas"]},{"id":"proverb-34","lead":"Santo de casa,","answer":"não faz milagre","alternatives":["nao faz milagres"]},{"id":"proverb-35","lead":"Quem não arrisca,","answer":"não petisca","alternatives":["nao ganha"]},{"id":"proverb-36","lead":"Não deixe para amanhã,","answer":"o que pode fazer hoje","alternatives":["o que se pode fazer hoje"]},{"id":"proverb-37","lead":"Quem tudo quer,","answer":"tudo perde","alternatives":[]},{"id":"proverb-38","lead":"Onde há fumaça,","answer":"há fogo","alternatives":["existe fogo","tem fogo"]},{"id":"proverb-39","lead":"Devagar,","answer":"se vai ao longe","alternatives":["vai se longe","se chega longe"]},{"id":"proverb-40","lead":"De médico e louco,","answer":"todo mundo tem um pouco","alternatives":["todos temos um pouco"]},{"id":"proverb-41","lead":"A curiosidade,","answer":"matou o gato","alternatives":[]},{"id":"proverb-42","lead":"O que os olhos não veem,","answer":"o coração não sente","alternatives":["o coracao nao sente"]},{"id":"proverb-43","lead":"A necessidade,","answer":"é a mãe da invenção","alternatives":["e a mae da invencao"]},{"id":"proverb-44","lead":"O seguro,","answer":"morreu de velho","alternatives":[]},{"id":"proverb-45","lead":"O tempo,","answer":"é o melhor remédio","alternatives":["e o melhor remedio"]},{"id":"proverb-46","lead":"A prática,","answer":"leva à perfeição","alternatives":["leva a perfeicao"]},{"id":"proverb-47","lead":"Amor com amor,","answer":"se paga","alternatives":[]},{"id":"proverb-48","lead":"A ocasião,","answer":"faz o ladrão","alternatives":["faz o ladrao"]},{"id":"proverb-49","lead":"Quem não tem cão,","answer":"caça com gato","alternatives":["caca como gato"]},{"id":"proverb-50","lead":"Mais vale um pássaro na mão,","answer":"do que dois voando","alternatives":["que dois voando"]},{"id":"proverb-51","lead":"Quem planta,","answer":"colhe","alternatives":["vai colher"]},{"id":"proverb-52","lead":"O pior cego,","answer":"é aquele que não quer ver","alternatives":["e o que nao quer ver","é quem não quer enxergar"]},{"id":"proverb-53","lead":"O olho do dono,","answer":"engorda o gado","alternatives":[]},{"id":"proverb-54","lead":"Quem canta,","answer":"seus males espanta","alternatives":[]},{"id":"proverb-55","lead":"A palavra é prata,","answer":"o silêncio é ouro","alternatives":["o silencio e ouro"]}];
export function evaluatePhrase(input,phrase){
 const text=normalizeAnswer(input);
 if(text.length<2)return 0;
 const candidates=[phrase.answer,...(phrase.alternatives||[])].map(normalizeAnswer);
 if(candidates.includes(text))return 100;
 // Approximation is intentionally conservative: spelling and missing small words,
 // not a claimed AI judgement of meaning.
 let best=0;
 for(const canonical of candidates){
   const dist=levenshtein(text,canonical);
   const chars=Math.max(text.length,canonical.length);
   const similarity=1-dist/chars;
   const a=new Set(text.split(" ").filter(Boolean)),b=new Set(canonical.split(" ").filter(Boolean));
   const shared=[...a].filter(t=>b.has(t)).length;
   const f1=2*shared/Math.max(1,a.size+b.size);
   if(Math.min(text.length,canonical.length)<canonical.length*0.58)continue;
   const negation=["nao","nunca","sem"];
   if(negation.some(word=>a.has(word)!==b.has(word)))continue;
   if(similarity>=0.88&&f1>=0.65)best=Math.max(best,90);
   else if(similarity>=0.77&&f1>=0.70)best=Math.max(best,75);
   else if(similarity>=0.68&&f1>=0.72)best=Math.max(best,60);
 }
 return best;
}
export function phraseQuestion(room){
 let candidates=PHRASES.map((item,i)=>({key:"phrase:"+i,index:i})).filter(q=>!room.used.includes(q.key));
 if(!candidates.length){room.used=[];candidates=PHRASES.map((item,i)=>({key:"phrase:"+i,index:i}));}
 const chosen=candidates[Math.floor(Math.random()*candidates.length)];
 room.question={type:"phrase",...chosen};room.used.push(chosen.key);
 room.answers={};room.lastResults=null;room.reactions=[];
 room.round++;room.special=!!room.config?.turbo&&room.round%3===0;room.phase="playing";room.nextAt=null;room.deadline=Date.now()+(room.config?.durationSeconds||30)*1000;
}

export function chooseQuestion(room){
 if(room.gameType==="phrases")return phraseQuestion(room);
 const allowed=room.config?.categoryIds?.length?room.config.categoryIds:BANKS.map(b=>b.id);
 let candidates=[];
 for(let bi=0;bi<BANKS.length;bi++){
   if(!allowed.includes(BANKS[bi].id))continue;
   const group=[];
   for(const limit of [...new Set([25,50,100].map(n=>Math.min(n,BANKS[bi].items.length)))])for(let position=1;position<=Math.min(limit,30);position++){
     const key=`${bi}:${limit}:${position}`;
     if(!room.used.includes(key))group.push({key,bi,limit,position});
   }
   if(group.length)candidates.push({bi,choices:group});
 }
 if(!candidates.length){room.used=[];return chooseQuestion(room);}
 const lastBi=room.question?.bi;
 if(candidates.length>1)candidates=candidates.filter(g=>g.bi!==lastBi);
 const group=candidates[Math.floor(Math.random()*candidates.length)];
 const selected=group.choices[Math.floor(Math.random()*group.choices.length)];
 room.used.push(selected.key); room.question=selected;room.answers={};room.lastResults=null;room.reactions=[];
 room.round+=1;room.special=!!room.config?.turbo&&room.round%3===0;room.phase="playing";room.nextAt=null;room.deadline=Date.now()+(room.config?.durationSeconds||30)*1000;
}

export function finalizeRoom(room,now){
 if(room.phase!=="playing")return false;
 const every=Object.keys(room.players).every(pid=>Object.hasOwn(room.answers,pid));
 if(!every&&now<room.deadline)return false;
 const q=room.question,isPhrase=q?.type==="phrase";
 const bank=isPhrase?null:BANKS[q.bi],board=bank?.items;
 const scored=Object.entries(room.answers).filter(([,a])=>isPhrase?(a.quality||0)>=60:a.rank!==null).map(([pid,a])=>({pid,nick:room.players[pid]?.nick||"Jogador",answer:a.answer,rank:a.rank,quality:isPhrase?(a.quality||0):null,distance:isPhrase?100-(a.quality||0):Math.abs(a.rank-q.position),at:a.at})).sort((a,b)=>a.distance-b.distance||a.at-b.at||a.pid.localeCompare(b.pid));
 const results=Object.entries(room.players).map(([pid,p])=>{
   const a=room.answers[pid],found=scored.find(t=>t.pid===pid),index=scored.findIndex(t=>t.pid===pid);
   const basePoints=found?(room.mode==="race"?(index===0?1:0):index===0?2:index===1?1:0):0;
   const earned=basePoints*(room.special?2:1);
   p.points+=earned;
   ensureStats(p);
   for(const stats of [p.stats,p.matchStats]){
     stats.played++;
     if(found){
       stats.valid++;stats.distanceSum+=found.distance;
       if(found.distance===0){
         stats.exact++;
         const start=room.deadline-(room.config?.durationSeconds||30)*1000;
         const responseMs=Math.max(0,found.at-start);
         stats.fastestExactMs=stats.fastestExactMs===null?responseMs:Math.min(stats.fastestExactMs,responseMs);
       }
       if(index===0)stats.first++;
       if(index===1)stats.second++;
       if(room.special&&index===0)stats.turboWins++;
     }
   }
   return {pid,nick:p.nick,answer:a?.answer||"Sem resposta",rank:isPhrase?null:a?.rank??null,quality:isPhrase?(a?.quality||0):null,distance:found?.distance??null,earned,points:p.points,missed:!found};
 }).sort((a,b)=>b.earned-a.earned||(a.distance??999)-(b.distance??999)||a.nick.localeCompare(b.nick));
 const solution=isPhrase?PHRASES[q.index].answer:board[q.position-1];
 room.lastResults={type:isPhrase?"phrase":"ranking",target:solution,prefix:isPhrase?PHRASES[q.index].lead:null,position:isPhrase?null:q.position,round:room.round,special:!!room.special,results};
 room.history=(room.history||[]).concat({round:room.round,category:isPhrase?"Frases & Aproximações":BANKS[q.bi].title,target:solution,position:isPhrase?null:q.position,special:!!room.special,results:results.map(t=>({pid:t.pid,nick:t.nick,distance:t.distance,quality:t.quality,earned:t.earned}))}).slice(-60);
 room.phase=(room.mode==="race"?Object.values(room.players).some(p=>p.points>=room.target)||room.round>=30:room.round>=room.target)?"finished":"reveal";
 room.nextAt=room.phase==="reveal"&&room.config?.autoNext?now+9000:null;
 if(room.phase==="finished"){
   room.matchesPlayed=(room.matchesPlayed||0)+1;
   const high=Math.max(...Object.values(room.players).map(p=>p.points),0);
   for(const p of Object.values(room.players)){ensureStats(p);p.stats.matches++;p.stats.wins+=p.points===high?1:0;}
   room.awards=calculateAwards(room);
 }
 return true;
}

export class ArenaRoom{
 constructor(ctx,env){this.ctx=ctx;this.env=env}
 async change(fn){
  let result;
  await this.ctx.storage.transaction(async tx=>{
    const state=await tx.get("room");
    result=fn(state);
    if(result.change)await tx.put("room",result.state);
  });
  if(result?.change)this.broadcast();
  if(result?.state?.phase==="finished"&&result?.state?.clubCode&&result?.state?.matchId){
    const state=result.state;
    const active=Object.values(state.players||{}).filter(p=>p.clubMemberId);
    if(active.length){
      try{
       const stub=this.env.ARENA.get(this.env.ARENA.idFromName("club:"+state.clubCode));
       await stub.fetch(new Request("https://club/club-record",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({matchId:state.matchId,gameType:state.gameType,players:active.map(p=>({clubMemberId:p.clubMemberId,points:p.points,exact:p.matchStats?.exact||0}))})}));
      }catch{}
    }
  }
  if(result?.alarm)await this.ctx.storage.setAlarm(result.alarm);
  else if(result?.state?.phase==="reveal"&&result.state.nextAt)await this.ctx.storage.setAlarm(result.state.nextAt);
  return result;
 }
 broadcast(){
  for(const ws of this.ctx.getWebSockets()){
   try{ws.send(JSON.stringify({type:"changed",at:Date.now()}))}catch{}
  }
 }
 async alarm(){
  await this.change(room=>{
   if(!room)return {error:"Sala não existe",status:404};
   const now=Date.now();
   if(room.phase==="reveal"&&room.config?.autoNext&&room.nextAt){
     if(now>=room.nextAt){chooseQuestion(room);return {change:true,state:room,alarm:room.deadline};}
     return {change:false,state:room,alarm:room.nextAt+100};
   }
   const changed=finalizeRoom(room,now);
   return {change:changed,state:room,alarm:!changed&&room.phase==="playing"?room.deadline+100:undefined};
  });
 }

 async clubAction(req){
  const path=new URL(req.url).pathname;
  let body={};
  if(req.method==="POST"){try{body=await req.json()}catch{return safeJson({error:"Requisição inválida"},400)}}
  const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"")||body.token||"";
  let output={status:500,error:"Operação não suportada"};
  await this.ctx.storage.transaction(async tx=>{
    let club=await tx.get("club");
    const now=Date.now();
    if(path==="/club-create"){
      if(club){output={status:409,error:"Código de clube em uso"};return;}
      const name=String(body.name||"").trim().slice(0,40),nick=String(body.nick||"").trim().slice(0,24);
      if(name.length<3||nick.length<2){output={status:400,error:"Informe nome do clube (3+ caracteres) e apelido"};return;}
      const id=crypto.randomUUID(),secret=randomToken();
      club={name,created:now,players:{[id]:{id,nick,token:secret,joined:now,played:0,wins:0,points:0,exact:0}},matches:[],updated:now};
      await tx.put("club",club);output={status:200,data:{id,token:secret,name}};return;
    }
    if(!club){output={status:404,error:"Clube não encontrado"};return;}
    if(path==="/club-join"){
      if(Object.keys(club.players).length>=40){output={status:409,error:"Clube cheio (40 membros)"};return;}
      const nick=String(body.nick||"").trim().slice(0,24);
      if(nick.length<2){output={status:400,error:"Apelido muito curto"};return;}
      if(Object.values(club.players).some(p=>normalizeAnswer(p.nick)===normalizeAnswer(nick))){output={status:409,error:"Esse apelido já está ocupado no clube"};return;}
      const id=crypto.randomUUID(),secret=randomToken();
      club.players[id]={id,nick,token:secret,joined:now,played:0,wins:0,points:0,exact:0};
      club.updated=now;await tx.put("club",club);
      output={status:200,data:{id,token:secret,name:club.name}};return;
    }
    if(path==="/club-record"){
      const key=String(body.matchId||"");
      if(!key){output={status:400,error:"Partida inválida"};return;}
      if(club.matches.some(m=>m.matchId===key)){output={status:200,data:{ok:true,duplicate:true}};return;}
      const all=Array.isArray(body.players)?body.players:[];
      const members=all.filter(p=>club.players[p.clubMemberId]&&club.players[p.clubMemberId].id===p.clubMemberId);
      if(!members.length){output={status:200,data:{ok:true,ignored:true}};return;}
      const high=Math.max(...members.map(p=>Number(p.points)||0));
      for(const entry of members){
       const p=club.players[entry.clubMemberId];
       p.played++;p.points+=Math.max(0,Number(entry.points)||0);
       p.exact+=Math.max(0,Number(entry.exact)||0);
       if(Number(entry.points)===high)p.wins++;
      }
      club.matches.unshift({matchId:key,date:now,gameType:body.gameType==="phrases"?"phrases":"ranking",results:members.map(p=>({id:p.clubMemberId,nick:club.players[p.clubMemberId].nick,points:p.points}))});
      club.matches=club.matches.slice(0,100);club.updated=now;
      await tx.put("club",club);output={status:200,data:{ok:true}};return;
    }
    const me=Object.values(club.players).find(p=>p.token===token);
    if(!me){output={status:403,error:"Sua sessão não pertence a este clube"};return;}
    if(path==="/club-check"){output={status:200,data:{id:me.id,nick:me.nick,name:club.name}};return;}
    if(path==="/club-state"){
      const leaderboard=Object.values(club.players).map(({id,nick,joined,played,wins,points,exact})=>({id,nick,joined,played,wins,points,exact})).sort((a,b)=>b.wins-a.wins||b.points-a.points||a.nick.localeCompare(b.nick,"pt-BR"));
      output={status:200,data:{name:club.name,players:leaderboard,matches:club.matches.slice(0,12),me:me.id,updated:club.updated}};return;
    }
  });
  return output.data?safeJson(output.data,output.status):safeJson({error:output.error},output.status);
 }

 async fetch(req){
  const url=new URL(req.url),path=url.pathname;
  if(path.startsWith("/club-"))return this.clubAction(req);
  if(path==="/clubmeta"){const r=await this.ctx.storage.get("room");return safeJson({clubCode:r?.clubCode||null})}
  if(path==="/ws"){
   const room=await this.ctx.storage.get("room"),p=Object.entries(room?.players||{}).find(([,v])=>v.token===url.searchParams.get("token"));
   if(!p)return safeJson({error:"Convite inválido ou sessão expirada"},403);
   if(req.headers.get("Upgrade")!=="websocket")return safeJson({error:"WebSocket necessário"},400);
   const pair=new WebSocketPair();const [client,server]=Object.values(pair);
   this.ctx.acceptWebSocket(server);server.serializeAttachment({playerId:p[0]});
   return new Response(null,{status:101,webSocket:client});
  }
  let body={};
  if(req.method==="POST"){try{body=await req.json();if(!body||typeof body!=="object")throw Error()}catch{return safeJson({error:"JSON inválido"},400)}}
  const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
  const r=await this.change(room=>{
   const now=Date.now();
   if(path==="/create"){
    if(room)return {error:"Código já está em uso",status:409};
    const nick=String(body.nick||"").trim().slice(0,24),mode=body.mode==="race"?"race":"rounds";
    if(nick.length<2)return {error:"Digite um nome com pelo menos 2 letras",status:400};
    const target=Math.max(1,Math.min(mode==="race"?15:20,Number.parseInt(body.target)||5));
    let config;
    try{config=normalizeRoomConfig(body.gameType==="phrases"?{...body,categoryIds:BANKS.map(b=>b.id)}:body)}catch(e){return {error:e.message,status:400};}
    const id=crypto.randomUUID(),secret=randomToken(),newRoom={clubCode:body.clubCode||null,matchId:crypto.randomUUID(),gameType:body.gameType==="phrases"?"phrases":"ranking",host:id,players:{[id]:{nick,token:secret,points:0,ready:false,lastSeen:now,clubMemberId:body.clubMemberId||null,stats:emptyStats(),matchStats:emptyStats()}},mode,target,config,round:0,used:[],answers:{},phase:"lobby",created:now,matchesPlayed:0,history:[],awards:[]};
    return {change:true,state:newRoom,data:{id,token:secret}};
   }
   if(!room)return {error:"Sala não encontrada",status:404};
   if(now-(room.created||now)>24*60*60*1000&&room.phase!=="closed"){room.phase="closed";return {change:true,state:room,error:"Essa sala expirou. Crie uma nova.",status:410};}
   if(room.phase==="closed"&&path==="/join")return {error:"Sala encerrada. Solicite outro convite.",status:410};
   if(path==="/join"){
    if(room.phase!=="lobby")return {error:"A partida já começou",status:409};
    if(Object.keys(room.players).length>=12)return {error:"Sala cheia (máximo 12 jogadores)",status:409};
    const nick=String(body.nick||"").trim().slice(0,24);
    if(nick.length<2)return {error:"Digite um apelido com pelo menos 2 letras",status:400};
    if(Object.values(room.players).some(p=>normalizeAnswer(p.nick)===normalizeAnswer(nick)))return {error:"Já existe um jogador com esse nome",status:409};
    const id=crypto.randomUUID(),secret=randomToken();
    room.players[id]={nick,token:secret,points:0,ready:false,lastSeen:now,clubMemberId:body.clubMemberId||null,stats:emptyStats(),matchStats:emptyStats()};
    return {change:true,state:room,data:{id,token:secret}};
   }
   const member=Object.entries(room.players).find(([,p])=>p.token===token);
   if(!member)return {error:"Sua sessão não pertence a esta sala",status:403};
   const id=member[0],isHost=id===room.host;
   let changed=finalizeRoom(room,now);
   if(path==="/state"){
    const q=room.question,bank=q?BANKS[q.bi]:null;
    const players=Object.entries(room.players).map(([pid,p])=>({id:pid,nick:p.nick,points:p.points,ready:!!p.ready,online:now-(p.lastSeen||room.created||now)<35000,submitted:!!room.answers[pid],stats:getPlayerStats(p)})).sort((a,b)=>b.points-a.points||a.nick.localeCompare(b.nick));
    return {change:changed,state:room,data:{version:"2.5",clubCode:room.clubCode||null,gameType:room.gameType||"ranking",phase:room.phase,code:room.code,host:room.host,me:id,isHost,mode:room.mode,target:room.target,config:room.config||normalizeRoomConfig(),special:!!room.special,matchesPlayed:room.matchesPlayed||0,nextAt:room.phase==="reveal"?room.nextAt||null:null,history:room.history||[],awards:room.phase==="finished"?room.awards||[]:[],round:room.round,deadline:room.deadline||null,serverNow:now,players,question:q?(q.type==="phrase"?{type:"phrase",category:"Ditados populares",lead:PHRASES[q.index].lead,source:"Sabedoria popular · ditados tradicionais",snapshot:"Português brasileiro",special:!!room.special,options:[]}:{type:"ranking",category:bank.title,source:bank.source,snapshot:bank.snapshot,position:q.position,limit:q.limit,special:!!room.special,options:bank.items.slice(0,q.limit).map(x=>({name:x})).sort((a,b)=>normalizeAnswer(a.name).localeCompare(normalizeAnswer(b.name)))}):null,lastResults:room.phase==="reveal"||room.phase==="finished"?room.lastResults:null,reactions:(room.reactions||[]).filter(evt=>now-evt.at<8500).map(evt=>({id:evt.id,emoji:evt.emoji,nick:evt.nick,at:evt.at}))}};
   }
   if(!isHost&&["start","next","restart","close","kick","handoff","hold-next"].includes(path.slice(1)))return {error:"Somente o anfitrião pode fazer isso",status:403};
   if(path==="/heartbeat"){
     room.players[id].lastSeen=now;
     const h=room.players[room.host];
     if(!h||now-(h.lastSeen||room.created||now)>75000){
       const available=Object.entries(room.players).filter(([pid,p])=>pid!==room.host&&now-(p.lastSeen||0)<35000);
       if(available.length)room.host=available.sort((a,b)=>(b[1].lastSeen||0)-(a[1].lastSeen||0))[0][0];
     }
     return {change:true,state:room,data:{ok:true,host:room.host}};
   }
   if(path==="/react"){
     const emojis=["🔥","😂","👏","🤯","🏆","😎"];
     const emoji=String(body.emoji||"");
     if(!emojis.includes(emoji))return {error:"Reação inválida",status:400};
     if(room.phase==="closed")return {error:"Sala encerrada",status:410};
     const actor=room.players[id];
     if(now-(actor.lastReactionAt||0)<1200)return {error:"Aguarde um instante para reagir novamente",status:429};
     actor.lastReactionAt=now;
     room.reactions=(room.reactions||[]).filter(evt=>now-evt.at<8500).slice(-11);
     const event={id:crypto.randomUUID(),emoji,nick:actor.nick,at:now};
     room.reactions.push(event);
     return {change:true,state:room,data:{ok:true,eventId:event.id}};
   }
   if(path==="/ready"){
     if(room.phase!=="lobby")return {error:"Pronto só pode ser alterado no lobby",status:409};
     room.players[id].ready=!room.players[id].ready;
     return {change:true,state:room,data:{ok:true,ready:room.players[id].ready}};
   }
   if(path==="/kick"){
     if(room.phase!=="lobby")return {error:"Só é possível remover alguém antes da partida",status:409};
     const target=String(body.playerId||"");
     if(!room.players[target]||target===id)return {error:"Jogador inválido",status:400};
     delete room.players[target];return {change:true,state:room,data:{ok:true}};
   }
   if(path==="/handoff"){
     const target=String(body.playerId||"");
     if(!room.players[target]||target===id)return {error:"Selecione outro jogador",status:400};
     room.host=target;return {change:true,state:room,data:{ok:true}};
   }
   if(path==="/leave"){
     if(room.phase!=="lobby"&&room.phase!=="finished")return {error:"Termine a rodada antes de sair definitivamente",status:409};
     delete room.players[id];if(room.host===id)room.host=Object.keys(room.players)[0]||null;
     if(!room.host)room.phase="closed";
     return {change:true,state:room,data:{ok:true}};
   }
   if(path==="/start"){
    if(room.phase!=="lobby")return {error:"A partida já foi iniciada",status:409};
    if(Object.keys(room.players).length<2)return {error:"São necessários 2 jogadores",status:409};
    const pending=Object.values(room.players).filter(p=>!p.ready||now-(p.lastSeen||room.created||now)>35000).map(p=>p.nick);
    if(pending.length)return {error:"Aguarde todos confirmarem presença: "+pending.join(", "),status:409};
    chooseQuestion(room);changed=true;
    return {change:true,state:room,data:{ok:true},alarm:room.deadline};
   }
   if(path==="/guess"||path==="/pass"){
    if(room.phase!=="playing"||now>=room.deadline)return {change:changed,state:room,error:"A rodada já terminou",status:409};
    if(Object.hasOwn(room.answers,id))return {error:"Você já respondeu nesta rodada",status:409};
    let answer="Passou",rank=null,quality=0;
    if(path==="/guess"){
      const raw=String(body.answer||"").trim().slice(0,160);
      if(!raw)return {error:"Digite um palpite ou use Passar",status:400};
      if(room.question.type==="phrase"){
        if(raw.length<2)return {error:"Escreva ao menos duas letras da continuação.",status:400};
        const candidate=normalizeAnswer(raw);
        if(Object.values(room.answers).some(a=>normalizeAnswer(a.answer)===candidate))return {error:"Essa continuação já foi enviada por outra pessoa. Tente uma diferente.",status:409};
        quality=evaluatePhrase(raw,PHRASES[room.question.index]);answer=raw;
      }else{
        const bank=BANKS[room.question.bi],options=bank.items.slice(0,room.question.limit),index=matchAnswer(raw,options);
        if(index<0)return {error:"Item não reconhecido. Tente uma sugestão: "+suggestAnswer(raw,options).join(", "),status:422};
        rank=index+1;answer=bank.items[index];
        if(Object.values(room.answers).some(a=>a.rank===rank))return {error:"Outro jogador já escolheu esse item! Tente outro.",status:409};
      }
    }
    room.answers[id]={answer,rank,quality,at:now};
    finalizeRoom(room,now);
    return {change:true,state:room,data:{ok:true},alarm:room.phase==="playing"?room.deadline:undefined};
   }
   if(path==="/hold-next"){
    if(room.phase!=="reveal"||!room.nextAt)return {error:"Não há avanço automático a pausar",status:409};
    room.nextAt=null;room.config={...room.config,autoNext:false};
    return {change:true,state:room,data:{ok:true}};
   }
   if(path==="/next"){
    if(room.phase!=="reveal")return {error:"Ainda não é hora da próxima rodada",status:409};
    chooseQuestion(room);
    return {change:true,state:room,data:{ok:true},alarm:room.deadline};
   }
   if(path==="/restart"){
    if(room.phase!=="finished")return {error:"Termine a partida antes da revanche",status:409};
    for(const p of Object.values(room.players)){p.points=0;p.matchStats=emptyStats();}
    room.round=0;room.used=[];room.awards=[];room.nextAt=null;room.matchId=crypto.randomUUID();
    chooseQuestion(room);return {change:true,state:room,data:{ok:true},alarm:room.deadline};
   }
   if(path==="/close"){
    room.phase="closed";return {change:true,state:room,data:{ok:true}};
   }
   return {error:"Ação inexistente",status:404};
  });
  if(r.error)return safeJson({error:r.error},r.status||400);
  return safeJson(r.data??{ok:true});
 }
}


const RIVIERA_IMAGES=new Map([
 ["/assets/riviera-logo-transparent.png","image/png"],
 ["/assets/riviera-reference-beach.jpg","image/jpeg"],
 ["/assets/riviera-coast-2026.jpg","image/jpeg"]
]);
export async function proxyImage(request,env){
 const url=new URL(request.url),type=RIVIERA_IMAGES.get(url.pathname);
 if(!type)return new Response("Not found",{status:404});
 const local=env?.ASSETS;
 if(local){try{const res=await local.fetch(request);if(res.ok)return res;}catch{}}
 const cache=typeof caches!=="undefined"?caches.default:null;
 const key=new Request(url.origin+url.pathname,{method:"GET"});
 if(cache){try{const hit=await cache.match(key);if(hit)return hit;}catch{}}
 const filename=url.pathname.split("/").pop();
 const upstreams=filename==="riviera-coast-2026.jpg"?["https://images.unsplash.com/photo-1510297895683-0f27794412d5?auto=format&fit=crop&w=1600&q=78"]:["https://raw.githubusercontent.com/felipeortuzal/triviaarena/main/assets/"+filename,"https://cdn.jsdelivr.net/gh/felipeortuzal/triviaarena@main/assets/"+filename];
 for(const target of upstreams){
   try{
    const res=await fetch(target,{redirect:"follow",headers:{"User-Agent":"RivieraShowdown/2.1"}});
    const size=Number(res.headers.get("content-length")||0);
    if(!res.ok||size>3*1024*1024)continue;
    const bytes=await res.arrayBuffer();
    if(!bytes.byteLength||bytes.byteLength>3*1024*1024)continue;
    const copy=new Response(bytes,{headers:{"content-type":type,"cache-control":"public, max-age=86400, stale-while-revalidate=604800","x-content-type-options":"nosniff","access-control-allow-origin":"*"}});
    if(cache)try{await cache.put(key,copy.clone());}catch{}
    return copy;
   }catch{}
 }
 return new Response("Imagem temporariamente indisponível",{status:503,headers:{"cache-control":"no-store"}});
}

async function handleRequest(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(RIVIERA_IMAGES.has(path))return proxyImage(request,env);
 if(path==="/api/status")return safeJson({app:"Riviera Showdown",online:true,version:"2.5",rankings:BANKS.length,phrases:PHRASES.length,features:["custom-rooms","turbo-rounds","group-stats","awards"]});
 if(path==="/api/rankings")return safeJson({rankings:BANKS.map(b=>({id:b.id,title:b.title,source:b.source,snapshot:b.snapshot,count:b.items.length,group:b.group||null,sourceUrl:b.sourceUrl||null}))});

 if(path==="/api/club"&&request.method==="POST"){
  let body;try{body=await request.json()}catch{return safeJson({error:"JSON inválido"},400)}
  for(let i=0;i<8;i++){
   const code=randomCode(),stub=env.ARENA.get(env.ARENA.idFromName("club:"+code));
   const resp=await stub.fetch(new Request("https://club/club-create",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)}));
   if(resp.status===409)continue;
   return safeJson({...await resp.json(),code},resp.status);
  }
  return safeJson({error:"Não foi possível criar o clube"},503);
 }
 const clubMatch=path.match(/^\/api\/club\/([A-HJ-NP-Z2-9]{6})(?:\/(join|state))?$/);
 if(clubMatch){
  const [_,code,action]=clubMatch,stub=env.ARENA.get(env.ARENA.idFromName("club:"+code));
  const headers=new Headers(request.headers);headers.delete("host");
  return stub.fetch(new Request("https://club/club-"+(action==="join"?"join":"state"),{method:request.method,headers,body:request.method==="POST"?request.body:undefined}));
 }

 if(path==="/api/room"&&request.method==="POST"){
  let body;try{body=await request.json()}catch{return safeJson({error:"JSON inválido"},400)}
  delete body.clubMemberId;
  if(body.clubCode&&body.clubToken){
   const code=String(body.clubCode||"").toUpperCase();
   if(!/^[A-HJ-NP-Z2-9]{6}$/.test(code))return safeJson({error:"Clube inválido"},400);
   const stub=env.ARENA.get(env.ARENA.idFromName("club:"+code));
   const valid=await stub.fetch(new Request("https://club/club-check",{headers:{authorization:"Bearer "+body.clubToken}}));
   if(!valid.ok)return safeJson({error:"Sessão do clube inválida"},403);
   body.clubMemberId=(await valid.json()).id;body.clubCode=code;
  }else{delete body.clubCode;delete body.clubToken;}
  for(let i=0;i<8;i++){
   const code=randomCode(),stub=env.ARENA.get(env.ARENA.idFromName(code));
   const resp=await stub.fetch(new Request("https://room/create",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)}));
   if(resp.status===409)continue;
   const data=await resp.json();
   return safeJson({...data,code},resp.status);
  }
  return safeJson({error:"Não foi possível abrir uma sala. Tente novamente."},503);
 }
 const match=path.match(/^\/api\/room\/([A-HJ-NP-Z2-9]{6})(?:\/(ws|join|start|guess|pass|next|restart|close|heartbeat|ready|kick|handoff|leave|react|hold-next))?$/);
 if(match){
  const [_,code,action]=match,stub=env.ARENA.get(env.ARENA.idFromName(code));
  const suffix=action?"/"+action:"/state",remote=new URL("https://room"+suffix);
  if(action==="join"&&request.method==="POST"){
    let data;try{data=await request.json()}catch{return safeJson({error:"JSON inválido"},400)}
    delete data.clubMemberId;
    if(data.clubToken){
      const state=await stub.fetch(new Request("https://room/clubmeta"));
      if(state.ok){
       const {clubCode}=await state.json();
       if(clubCode){
        const club=env.ARENA.get(env.ARENA.idFromName("club:"+clubCode));
        const valid=await club.fetch(new Request("https://club/club-check",{headers:{authorization:"Bearer "+data.clubToken}}));
        if(valid.ok)data.clubMemberId=(await valid.json()).id;
       }
      }
    }
    delete data.clubToken;
    return stub.fetch(new Request(remote.toString(),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(data)}));
  }
  if(action==="ws"){remote.pathname="/ws";remote.search=url.search;}
  const headers=new Headers(request.headers);headers.delete("host");
  return stub.fetch(new Request(remote.toString(),{method:request.method,headers,body:request.method==="POST"?request.body:undefined}));
 }
 if(path.startsWith("/api/"))return safeJson({error:"Rota não encontrada"},404);
 return env.ASSETS.fetch(request);
}

export default {fetch:handleRequest};