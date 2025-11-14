const layout  = document.getElementById("layout");
const detail  = document.getElementById("detail");
const closeBtn = document.getElementById("closeBtn");
const stage   = document.getElementById("stage");

// Detail fields
const dName  = document.getElementById("dName");
const dRole  = document.getElementById("dRole");
const dCity  = document.getElementById("dCity");
const dEmail = document.getElementById("dEmail");
const timelineList = document.getElementById("timelineList");
const updatesList  = document.getElementById("updatesList");

let snapping = false;
let snapThreshold = 0.25; // hoe dicht een kaart moet zijn voordat hij snapt

// Dummy data - met echte letters A–Z
const names = [
  "Anna Brooks","Ben Carter","Claire Donahue","David Evans","Elise Fox","Frank Green",
  "Grace Hill","Hugo Irons","Ivy Johnson","Jack Kelly","Kira Lewis","Leo Martin",
  "Maya Novak","Noah Owen","Olivia Park","Pieter Quinn","Quincy Reed","Rosa Silva",
  "Seth Turner","Tara Ulrich","Uma Veen","Vince Wolf","Wes Young","Xena Zhao",
  "Yuri Akers","Zoe Burr"
];
const roles = ["UX Designer","Frontend Dev","Product Designer","Visual Designer","Engineer"];
const cities = ["Rotterdam","Amsterdam","Utrecht","Antwerp","Berlin","London"];

function makeContact(i){
  const name = names[i % names.length];
  return {
    name,
    role: roles[i % roles.length],
    city: cities[i % cities.length],
    email: `${name.split(" ")[0].toLowerCase()}@example.com`,
    timeline: [
      {year:"2025", what:"Joined studio"},
      {year:"2023", what:"Major project"},
      {year:"2021", what:"Started role"}
    ],
    updates: [
      "Working on redesign.",
      "Investigating new tools.",
      "Helping team with system."
    ]
  };
}
const contacts = Array.from({length:48},(_,i)=>makeContact(i));

// Build cards
contacts.forEach((c, index)=>{
  const el = document.createElement("div");
  el.className = "card";
  el.setAttribute("data-letter", c.name[0].toUpperCase());
  el.innerHTML = `
    <div class="front">
      <h3>${c.name}</h3>
      <p>${c.role}</p>
    </div>
    <div class="back"></div>
  `;
  el.addEventListener("click", () => {
    // Check if this card is active
    if (el.classList.contains('is-active')) {
      // If active, open detail panel
      openDetail(c);
    } else {
      // If not active, navigate to this card
      const target = index * SPACING;
      gsap.to(smooth, {
        duration: 0.4,
        val: target,
        ease: "power2.out",
        onUpdate: () => {
          scrollPos = smooth.val;
        }
      });
    }
  });
  stage.appendChild(el);
});

const cards = [...document.querySelectorAll(".card")];

// Animated scroll position state (used for smooth snapping)
const smooth = { val: 0 };

// Infinite rolodex engine
let paused=false, scrollPos=0, velocity=0;
const SPACING=8, RADIUS=12, MAX_TILT=90;
let isSnapping = false;

function render(){
  if(!paused && !isSnapping){ 
    scrollPos+=velocity; 
    smooth.val = scrollPos; // Keep smooth in sync
    velocity*=0.93; 
    
    // Snap to nearest item when velocity is low enough
    if(Math.abs(velocity) < 0.1 && Math.abs(velocity) > 0.001) {
      isSnapping = true;
      velocity = 0;
      
      const total = cards.length;
      const currentIndex = Math.round(scrollPos / SPACING);
      const target = currentIndex * SPACING;
      
      gsap.to(smooth, {
        duration: 0.3,
        val: target,
        ease: "power2.out",
        onUpdate: () => {
          scrollPos = smooth.val;
        },
        onComplete: () => {
          isSnapping = false;
        }
      });
    }
  }

  const total=cards.length;

  cards.forEach((card,i)=>{
    const offset=((i*SPACING+scrollPos)%(SPACING*total))-SPACING;
    const progress=offset/SPACING;
    
    // Rotatie: positieve progress = kaartje klapt naar voren (vanaf bottom)
    // Bij progress = 1 moet het -180deg zijn om de achterkant te zien
    // Negatieve progress = kaartje komt van achteren
    const rotX = progress > 0 ? -progress * 180 : progress * MAX_TILT;
    
    // Scale voor diepte effect: kaartjes achter zijn kleiner, actief is 1.0
    let scale = 1;
    if (progress < 0) {
      // Achter = kleiner
      scale = 1 + (progress / 4); // Van 1.0 naar 0.75
    } else if (progress > 0) {
      // Naar voren geklapt = iets groter
      scale = 1 + (progress * 0); // Van 1.0 naar 1.2
    }
    
    // Opacity: meer kaartjes zichtbaar (tot progress -4 of +2)
    let opacity = 1;
    if (progress < -4) opacity = 0;
    else if (progress < 0) opacity = 1 + (progress / 4); // Fade out achteraan
    else if (progress > 2) opacity = 0;
    else if (progress > 0) opacity = 1 - (progress / 2); // Fade out vooraan
    
    // Z-index: kaartjes die naar voren klappen (positieve progress) = hoger
    // Actief kaartje (progress ≈ 0) = hoogste
    const zIndex = 200 + Math.round(progress * 30);

    gsap.set(card,{
      x: 0, // Gecentreerd, geen horizontale verschuiving
      y: offset * 0.5, // Verticale spacing
      rotationX: rotX,
      scale: scale,
      opacity: opacity,
      zIndex: zIndex
    });

    card.classList.toggle("is-active",Math.abs(progress)<0.15);
  });

  requestAnimationFrame(render);
}
render();

// ---------- A–Z Smooth Scroll ----------
const az = document.getElementById("azScrub");
const letters = az.querySelectorAll("li");

// Map letters -> index (eerste voorkomen)
const byLetter = {};
contacts.forEach((c, i) => {
  const L = c.name[0].toUpperCase();
  if (!byLetter[L]) byLetter[L] = i;
});

letters.forEach(li => {
  li.addEventListener("click", () => {
    const L = li.textContent;
    if (byLetter[L] !== undefined) {
      const index = byLetter[L];
      const target = index * SPACING;

      gsap.to(smooth, {
        duration: 0.6,
        val: target,
        ease: "power2.out",
        onUpdate: () => {
          scrollPos = smooth.val;
        }
      });
    } else {
      // Kleine feedback als letter niets heeft
      gsap.fromTo(li, { opacity: .3 }, {
        opacity: 1,
        duration: .2,
        yoyo: true,
        repeat: 1
      });
    }
  });
});

// Wheel scroll
window.addEventListener("wheel",e=>{
  if(!paused) velocity+=e.deltaY*0.04;
},{passive:true});

// Open panel
function openDetail(c){
  // paused=true;

  dName.textContent=c.name;
  dRole.textContent=c.role;
  dCity.textContent=c.city;
  dEmail.textContent=c.email;
  dEmail.href="mailto:"+c.email;

  timelineList.innerHTML=c.timeline.map(t=>`<li>${t.year} — ${t.what}</li>`).join("");
  updatesList.innerHTML=c.updates.map(u=>`<li>${u}</li>`).join("");

  // animate flex widths
  layout.style.setProperty("--rolodex-w","60%");
  layout.style.setProperty("--detail-w","40%");

  layout.classList.add("panel-open");
}

// Close panel
function closeDetail(){
  layout.style.setProperty("--rolodex-w","100%");
  layout.style.setProperty("--detail-w","0%");
  layout.classList.remove("panel-open");
  // paused=false;
}

closeBtn.addEventListener("click",closeDetail);

// Navigate to next/previous item
function navigateToItem(direction) {
  const currentIndex = Math.round(scrollPos / SPACING);
  const total = cards.length;
  let targetIndex;
  
  // next = naar hogere index, prev = naar lagere index
  if (direction === 'next') {
    targetIndex = (currentIndex + 1) % total;
  } else {
    targetIndex = (currentIndex - 1 + total) % total;
  }
  
  const target = targetIndex * SPACING;
  
  gsap.to(smooth, {
    duration: 0.4,
    val: target,
    ease: "power2.out",
    onUpdate: () => {
      scrollPos = smooth.val;
    }
  });
}

// Get the currently active contact
function getActiveContact() {
  const activeCard = cards.find(card => card.classList.contains('is-active'));
  if (activeCard) {
    const cardIndex = cards.indexOf(activeCard);
    return contacts[cardIndex];
  }
  // Fallback: find card closest to center
  const currentIndex = Math.round(scrollPos / SPACING) % contacts.length;
  return contacts[currentIndex];
}

document.addEventListener("keydown",e=>{
  if(e.key==="Escape") {
    closeDetail();
  } else if(e.key==="ArrowRight" || e.key==="ArrowDown") {
    e.preventDefault();
    navigateToItem('next');
  } else if(e.key==="ArrowLeft" || e.key==="ArrowUp") {
    e.preventDefault();
    navigateToItem('prev');
  } else if(e.key==="Enter") {
    e.preventDefault();
    const activeContact = getActiveContact();
    if (activeContact) {
      openDetail(activeContact);
    }
  }
});