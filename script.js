const lista = document.getElementById("character-list");
const pesquisa = document.getElementById("search");

let personagens = [];

async function carregarPersonagens(){

    const resposta = await fetch("api/characters.json");

    personagens = await resposta.json();

    renderizar(personagens);
}

function renderizar(listaPersonagens){

    lista.innerHTML = "";

    listaPersonagens.forEach(personagem=>{

        const card = document.createElement("div");

        card.className = "card";

        card.innerHTML = `
            <img src="${personagem.image}" alt="${personagem.name}">

            <div class="card-info">

                <h2>${personagem.name}</h2>

                <p>${personagem.role}</p>

            </div>
        `;

        card.onclick = ()=>{

            window.location.href =
            `edgerunners.html?id=${personagem.id}`;

        };

        lista.appendChild(card);

    });

}

pesquisa.addEventListener("input",()=>{

    const termo = pesquisa.value.toLowerCase();

    renderizar(

        personagens.filter(personagem=>

            personagem.name.toLowerCase().includes(termo)

        )

    );

});

carregarPersonagens();