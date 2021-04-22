package utils

import (
  "sync"
)


type Threadset struct {
  storage map[string]bool
  mu sync.Mutex
}


func (t *Threadset) Insert(s string) {
  t.mu.Lock()
  defer t.mu.Unlock()

  t.storage[s] = true
}


func (t *Threadset) Contains(s string) bool {
  t.mu.Lock()
  defer t.mu.Unlock()

  return t.storage[s]
}

