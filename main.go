  package main

import (
  "fmt"

  "jakcharvat.dev/ibdocuments-crawler/networking"
)


const l_ROOT_URL = "https://www.ibdocuments.com/IB%20PAST%20PAPERS%20-%20SUBJECT/"


func main() {
  links, pdfs, err := networking.Crawl(l_ROOT_URL)
  if err != nil {
    fmt.Println("Error fetching from url", l_ROOT_URL)
    fmt.Println(err)
    return
  }

  fmt.Println(links, pdfs)
}

