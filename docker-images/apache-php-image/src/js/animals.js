$(function() {
    console.log("animals");

    function getAnimals(){
            $.getJSON("/animals/", function(animals) {
                    var message = "No animals.";
                    if(animals.length > 0){
                            message = animals[0].animal + " " + animals[0].bruit;
                    }
                    $(".custom-content").text(message);
            });
    }
    setInterval(getAnimals, 2000);
});