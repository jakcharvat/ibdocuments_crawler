package networking

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"regexp"
	"strings"

	"github.com/PuerkitoBio/goquery"
)

type Link struct {
  title string
  link string
}

func getHtml(addr string) (text string, res *http.Response, err error) {
  var bytes []byte

  res, err = http.Get(addr)
  if err != nil {
    fmt.Println("Error sending GET request to", addr)
    return
  }
  defer res.Body.Close()

  bytes, err = ioutil.ReadAll(res.Body)
  if err != nil {
    fmt.Println("Error reading response")
    return
  }

  text = string(bytes)
  return
}

const l_LINK_SELECTOR = "#indexlist > tbody > tr:not(.even-parentdir) > td.indexcolname > a"

func Crawl(url string) (links []Link, pdfs []Link, err error) {
  endSlashRegex := regexp.MustCompile("/$")
  noGroupRegex  := regexp.MustCompile("^Group [0-9] - ")
  pdfRegex      := regexp.MustCompile("\\.pdf$")

  src, _, err := getHtml(url)
  if err != nil {
    fmt.Println("Error fetching source")
    return
  }

  sr := strings.NewReader(src)
  doc, err := goquery.NewDocumentFromReader(sr)
  if err != nil {
    fmt.Println("Error parsing DOM:", err)
    return
  }

  links = []Link{}
  pdfs  = []Link{}

  doc.Find(l_LINK_SELECTOR).Each(func (i int, s *goquery.Selection) {
    noSlash := endSlashRegex.ReplaceAllString(s.Text(), "")
    noGroup := noGroupRegex.ReplaceAllString(noSlash, "")
    href, e := s.Attr("href")
    if !e { return }

    linkEl := Link{noGroup, url + href}
    if len(pdfRegex.FindStringIndex(href)) == 0 {
      links = append(links, linkEl)
    } else {
      pdfs = append(pdfs, linkEl)
    }
  })

  return
}


