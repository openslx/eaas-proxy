// Copyright 2019 The Emulation-as-a-Service Authors
// SPDX-License-Identifier: CC0-1.0

#include <arpa/inet.h>
#include <linux/if_packet.h>
#include <net/ethernet.h>
#include <stdio.h>
#include <sys/socket.h>
#include <sys/types.h>
#include <unistd.h>

int main() {
  int sock = socket(AF_PACKET, SOCK_RAW, htons(ETH_P_ALL));
  if (sock) {
    perror("socket");
    return 1;
  }
  const uint32_t header[] = {
      0xa1b2c3d4, 0x00040002, 0x00000000, 0x00000000, 0x0000ffff, 0x00000001,
  };
  write(1, header, sizeof header);
  for (;;) {
    char buffer[4096];
    uint32_t len = recv(sock, buffer, sizeof buffer, 0);
    // Date/time
    write(1, (uint32_t[]){0}, 8);
    // Length
    write(1, &len, sizeof len);
    write(1, &len, sizeof len);
    write(1, buffer, len);
  }
}
