import os
from icrawler.builtin import BingImageCrawler

dataset = {

"broken_electric_pole":[
"broken electric pole street",
"damaged power pole road",
"electric pole broken city",
"utility pole damage street"
],

"construction_waste":[
"construction debris roadside",
"building rubble street",
"construction waste pile road",
"demolition debris urban"
],

"drain_overflow":[
"drain overflow street",
"sewer overflow road",
"blocked drainage overflow",
"drain water overflow city"
],

"exposed_wires":[
"exposed electric wires pole",
"hanging electric wires street",
"open electrical wiring pole",
"damaged power wires pole"
],

"fallen_pole":[
"fallen electric pole road",
"down power pole street",
"electric pole fallen storm",
"utility pole collapsed street"
],

"overflowing_bin":[
"overflowing garbage bin street",
"trash bin overflowing public",
"dustbin full roadside",
"garbage bin overflow city"
],

"potholes":[
"road pothole damage",
"deep pothole asphalt road",
"street pothole urban road",
"large pothole street road"
],

"road_blockage":[
"road blocked debris",
"street road blockage construction",
"blocked road obstacle street",
"road blocked garbage street"
],

"road_cracks":[
"cracked asphalt road",
"road cracks pavement damage",
"street surface crack road",
"damaged cracked street road"
],

"trash_pile":[
"garbage pile roadside",
"illegal trash dumping street",
"urban garbage heap street",
"waste pile roadside"
],

"water_leakage":[
"water pipe leakage street",
"municipal water leak road",
"broken water pipe street",
"water supply leakage road"
],

"waterlogging":[
"rain flooded road city",
"street waterlogging rain",
"urban road flooding rain",
"road waterlogging monsoon"
],

"streetlight_issue":[
"broken street light pole",
"damaged street light road",
"street light not working pole",
"streetlight broken urban road"
]

}

base_dir = "dataset"

for category, keywords in dataset.items():

    folder = os.path.join(base_dir, category)
    os.makedirs(folder, exist_ok=True)

    for keyword in keywords:

        print(f"Downloading {keyword} -> {category}")

        crawler = BingImageCrawler(storage={"root_dir": folder})

        crawler.crawl(
            keyword=keyword,
            max_num=150
        )

print("Download completed")