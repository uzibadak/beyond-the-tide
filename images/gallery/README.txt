CAPTURE 사진 폴더

1. 이 폴더에 사진을 넣으세요. 예: 01.jpg
2. index.html의 gallery-item 안에 있는 gallery-placeholder를 아래처럼 바꾸세요.
   <img src="images/gallery/01.jpg" alt="사진 설명">
3. data-category는 daily / date / memory 중 하나로 지정하면 상단 필터가 작동합니다.
4. 사진 비율은 자르지 않고 원본 비율대로 표시됩니다.
5. gallery-item 블록을 복사하면 사진을 계속 추가할 수 있습니다.


[현재 갤러리 표시 방식]
- 목록 썸네일은 4:5 비율로 자동 크롭됩니다.
- 원본 파일은 잘리지 않으며, 클릭하면 라이트박스에서 원본 전체가 표시됩니다.
- 특정 사진의 썸네일 위치를 조정하려면 img 태그에 style="object-position:center top;" 등을 추가하세요.
